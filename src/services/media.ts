import { apiClient } from "@core/network/api";
import {
  CreateMediaUploadDto,
  CreateMediaUploadResponseDto,
  MediaAssetResponseDto,
  MediaPurpose,
} from "@shared/types/api";

export interface UploadMediaInput {
  uri: string;
  purpose?: MediaPurpose;
  contentType?: string;
  originalFilename?: string;
  sizeBytes?: number;
  clientUploadId?: string;
}

export class MediaService {
  static async createUpload(
    data: CreateMediaUploadDto,
  ): Promise<CreateMediaUploadResponseDto> {
    const response = await apiClient.post<CreateMediaUploadResponseDto>(
      "/media/uploads",
      data,
    );
    return response.data;
  }

  static async completeUpload(
    mediaId: string,
  ): Promise<MediaAssetResponseDto> {
    const response = await apiClient.post<MediaAssetResponseDto>(
      `/media/uploads/${mediaId}/complete`,
    );
    return response.data;
  }

  static async uploadMedia(
    input: UploadMediaInput,
  ): Promise<MediaAssetResponseDto> {
    const uri = input.uri;
    const originalFilename =
      input.originalFilename || uri.split("/").pop() || "upload.jpg";

    let contentType = input.contentType;
    if (!contentType) {
      const ext = originalFilename.split(".").pop()?.toLowerCase();
      if (ext === "png") contentType = "image/png";
      else if (ext === "webp") contentType = "image/webp";
      else if (ext === "gif") contentType = "image/gif";
      else if (ext === "heic") contentType = "image/heic";
      else contentType = "image/jpeg";
    }

    const clientUploadId =
      input.clientUploadId ||
      `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const purpose = input.purpose || "profile_avatar";
    const sizeBytes = input.sizeBytes || 1;

    // 1. Initiate upload with backend
    const { media, upload } = await this.createUpload({
      clientUploadId,
      purpose,
      contentType,
      sizeBytes,
      originalFilename,
    });

    // 2. Direct upload to Cloudinary (if authorization fields returned)
    if (upload && upload.url) {
      const formData = new FormData();
      if (upload.fields) {
        Object.entries(upload.fields).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }

      formData.append("file", {
        uri,
        name: originalFilename,
        type: contentType,
      } as any);

      const response = await fetch(upload.url, {
        method: upload.method || "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Storage upload failed (${response.status}): ${errorText}`,
        );
      }
    }

    // 3. Mark upload as complete
    const completedAsset = await this.completeUpload(media.id);
    return completedAsset;
  }
}
