jest.mock("@core/network/api", () => ({ apiClient: { post: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => require("crypto").randomUUID() }));

import { apiClient } from "@core/network/api";
import { MediaService } from "@services/media";

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
