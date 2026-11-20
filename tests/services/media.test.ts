jest.mock("@core/network/api", () => ({ apiClient: { post: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => require("crypto").randomUUID() }));

import { AxiosError } from "axios";
import { apiClient } from "@core/network/api";
import { StaleSessionError } from "@core/network/errors";
import { MediaService, UploadExpiredError } from "@services/media";
import { useUploadProgressStore } from "@shared/store/upload-progress";

const post = apiClient.post as jest.Mock;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const input = {
  uri: "file:///a.jpg",
  purpose: "message_attachment" as const,
  contentType: "image/jpeg",
  originalFilename: "a.jpg",
  sizeBytes: 1234,
};

describe("MediaService.uploadMedia", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUploadProgressStore.getState().clear();
    post.mockImplementation(async (url: string) =>
      url === "/media/uploads"
        ? { data: { media: { id: "media-1" }, upload: null } }
        : { data: { id: "media-1", status: "ready" } },
    );
  });

  it("sends the real metadata with a UUID upload id", async () => {
    await MediaService.uploadMedia(input);

    const [, body] = post.mock.calls[0];
    expect(body).toMatchObject({ sizeBytes: 1234, contentType: "image/jpeg", originalFilename: "a.jpg" });
    expect(body.clientUploadId).toMatch(UUID);
  });

  it("reuses the caller's upload id so retries are deduplicated", async () => {
    await MediaService.uploadMedia({ ...input, clientUploadId: "kept-id" });
    expect(post.mock.calls[0][1].clientUploadId).toBe("kept-id");
  });

  it("refuses to upload without a real size", async () => {
    await expect(MediaService.uploadMedia({ ...input, sizeBytes: 0 })).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});

describe("staged upload recovery", () => {
  const transfer = jest.fn();
  const inAnHour = () => new Date(Date.now() + 3_600_000).toISOString();
  const authorization = (expiresAt = inAnHour()) => ({
    url: "https://storage.example/upload",
    method: "POST",
    expiresAt,
    fields: { signature: "s" },
  });
  const httpError = (status: number) =>
    new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status,
      statusText: "",
      data: {},
      headers: {},
      config: {} as never,
    });
  const createCalls = () => post.mock.calls.filter(([url]) => url === "/media/uploads").length;
  const completeCalls = () => post.mock.calls.filter(([url]) => url.endsWith("/complete")).length;

  beforeEach(() => {
    jest.clearAllMocks();
    useUploadProgressStore.getState().clear();
    transfer.mockResolvedValue({ ok: true, text: async () => "" });
    globalThis.fetch = transfer as never;
  });

  it("retries only completion after a completion failure, without a second transfer", async () => {
    let completeAttempts = 0;
    post.mockImplementation(async (url: string) => {
      if (url === "/media/uploads") return { data: { media: { id: "m1" }, upload: authorization() } };
      if (++completeAttempts === 1) throw httpError(409);
      return { data: { id: "m1", status: "ready" } };
    });
    const upload = { ...input, clientUploadId: "u1" };

    await expect(MediaService.uploadMedia(upload)).rejects.toBeInstanceOf(AxiosError);
    await expect(MediaService.uploadMedia(upload)).resolves.toMatchObject({ id: "m1" });

    expect(createCalls()).toBe(1);
    expect(transfer).toHaveBeenCalledTimes(1);
    expect(completeCalls()).toBe(2);
  });

  it("reuses a completed asset when a later step (e.g. avatar assignment) failed", async () => {
    post.mockImplementation(async (url: string) =>
      url === "/media/uploads"
        ? { data: { media: { id: "m1" }, upload: authorization() } }
        : { data: { id: "m1", status: "ready" } },
    );
    const upload = { ...input, clientUploadId: "u1" };

    await MediaService.uploadMedia(upload);
    await MediaService.uploadMedia(upload);

    expect(createCalls()).toBe(1);
    expect(transfer).toHaveBeenCalledTimes(1);
    expect(completeCalls()).toBe(1);
  });

  it("treats an expired authorization as a restart, not a retry", async () => {
    post.mockResolvedValueOnce({
      data: { media: { id: "m1" }, upload: authorization(new Date(Date.now() - 1000).toISOString()) },
    });

    await expect(MediaService.uploadMedia({ ...input, clientUploadId: "u1" })).rejects.toBeInstanceOf(
      UploadExpiredError,
    );
    expect(transfer).not.toHaveBeenCalled();
    expect(useUploadProgressStore.getState().uploads.u1).toBeUndefined();
  });

  it("maps a server-side expiry (410) to UploadExpiredError", async () => {
    post.mockRejectedValueOnce(httpError(410));
    await expect(MediaService.uploadMedia({ ...input, clientUploadId: "u1" })).rejects.toBeInstanceOf(
      UploadExpiredError,
    );
  });

  it("stops between stages once its session has ended, and leaves no progress behind", async () => {
    let current = true;
    const session = {
      generation: 1,
      isCurrent: () => current,
      assertCurrent: () => {
        if (!current) throw new StaleSessionError();
      },
    };
    post.mockResolvedValueOnce({ data: { media: { id: "m1" }, upload: authorization() } });
    transfer.mockImplementation(async () => {
      current = false; // the account switches while the file is being transferred
      return { ok: true, text: async () => "" };
    });

    await expect(
      MediaService.uploadMedia({ ...input, clientUploadId: "u1" }, { session }),
    ).rejects.toBeInstanceOf(StaleSessionError);

    expect(completeCalls()).toBe(0);
    expect(post.mock.calls[0][2]).toEqual({ sessionGeneration: 1 });
    expect(useUploadProgressStore.getState().uploads.u1).toBeUndefined();
  });
});
