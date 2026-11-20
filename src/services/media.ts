import axios, { type AxiosRequestConfig } from "axios";
import { apiClient } from "@core/network/api";
import {
  CreateMediaUploadDto,
  CloudinaryUploadAuthorizationDto,
  CreateMediaUploadResponseDto,
  MediaAssetResponseDto,
  MediaPurpose,
} from "@shared/types/api";
import * as Crypto from "expo-crypto";
import type { SessionHandle } from "@services/token-manager";
import { UploadProgress, useUploadProgressStore } from "@shared/store/upload-progress";

export interface UploadMediaInput {
  uri: string;
  purpose: MediaPurpose;
  contentType: string;
  originalFilename: string;
  sizeBytes: number;
  /** Keep the same id when retrying an upload so the server can deduplicate it. */
  clientUploadId?: string;
}

/** The upload's storage authorization expired; start again with a new `clientUploadId`. */
export class UploadExpiredError extends Error {
  constructor() {
    super("The upload authorization expired");
    this.name = "UploadExpiredError";
  }
}

async function transferToStorage(
  authorization: CloudinaryUploadAuthorizationDto,
  file: { uri: string; name: string; type: string },
) {
  const formData = new FormData();
  Object.entries(authorization.fields ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  });
  formData.append("file", file as unknown as Blob);

  const response = await fetch(authorization.url, {
    method: authorization.method || "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Storage upload failed (${response.status}): ${await response.text()}`);
  }
}

export class MediaService {
  static async createUpload(
    data: CreateMediaUploadDto,
    config?: AxiosRequestConfig,
  ): Promise<CreateMediaUploadResponseDto> {
    const response = await apiClient.post<CreateMediaUploadResponseDto>(
      "/media/uploads",
      data,
      config,
    );
    return response.data;
  }

  static async completeUpload(
    mediaId: string,
    config?: AxiosRequestConfig,
  ): Promise<MediaAssetResponseDto> {
    const response = await apiClient.post<MediaAssetResponseDto>(
      `/media/uploads/${mediaId}/complete`,
      undefined,
      config,
    );
    return response.data;
  }

  /**
   * Uploads a local file as a staged, resumable operation:
   * authorize → transfer to storage → complete. Each finished stage is recorded under
   * the `clientUploadId`, so retrying after a failure repeats only what remains (a
   * failed completion doesn't transfer the file again). An expired authorization
   * throws `UploadExpiredError`; retry with a new `clientUploadId`.
   *
   * With `session`, every request is pinned to it and ownership is re-checked after
   * each await, so an upload started by one session never continues into another.
   */
  static async uploadMedia(
    input: UploadMediaInput,
    options: { session?: SessionHandle } = {},
  ): Promise<MediaAssetResponseDto> {
    const { uri, purpose, contentType, originalFilename, sizeBytes } = input;
    if (!uri || !contentType || !originalFilename || !(sizeBytes > 0)) {
      throw new Error("Upload requires the file's URI, content type, name and size");
    }
    const clientUploadId = input.clientUploadId ?? Crypto.randomUUID();
    const { session } = options;
    const config: AxiosRequestConfig = { sessionGeneration: session?.generation };
    const check = () => session?.assertCurrent();
    const progressStore = useUploadProgressStore.getState;
    const save = (progress: UploadProgress) => {
      check();
      progressStore().set(clientUploadId, progress);
    };

    try {
      let progress = progressStore().uploads[clientUploadId];

      // 1. Authorize (or replay: the same clientUploadId returns the same media).
      if (!progress) {
        check();
        const { media, upload } = await this.createUpload(
          { clientUploadId, purpose, contentType, sizeBytes, originalFilename },
          config,
        );
        // No authorization means this upload id already belongs to a completed asset.
        progress = upload
          ? { stage: "authorized", mediaId: media.id, authorization: upload }
          : media.status === "ready"
            ? { stage: "completed", mediaId: media.id, asset: media }
            : { stage: "transferred", mediaId: media.id };
        save(progress);
      }

      // 2. Transfer directly to storage, unless that already succeeded.
      if (progress.stage === "authorized") {
        const { authorization } = progress;
        if (Date.parse(authorization.expiresAt) <= Date.now()) throw new UploadExpiredError();

        check();
        await transferToStorage(authorization, { uri, name: originalFilename, type: contentType });
        progress = { stage: "transferred", mediaId: progress.mediaId };
        save(progress);
      }

      // 3. Ask the server to verify the stored object.
      if (progress.stage === "transferred") {
        check();
        const asset = await this.completeUpload(progress.mediaId, config);
        progress = { stage: "completed", mediaId: progress.mediaId, asset };
        save(progress);
      }

      return progress.asset;
    } catch (error) {
      const expired =
        error instanceof UploadExpiredError ||
        (axios.isAxiosError(error) && error.response?.status === 410);
      if (expired) {
        progressStore().remove(clientUploadId);
        throw new UploadExpiredError();
      }
      throw error;
    } finally {
      if (session && !session.isCurrent()) {
        // Nothing of an ended session's upload should linger for the next account.
        progressStore().remove(clientUploadId);
      }
    }
  }

  /** Forgets an upload once its asset has been used (sent or assigned). */
  static forgetUpload(clientUploadId: string) {
    useUploadProgressStore.getState().remove(clientUploadId);
  }
}
