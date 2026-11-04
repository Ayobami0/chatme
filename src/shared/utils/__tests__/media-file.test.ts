const mockSizes: Record<string, number> = {};
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri: string) => ({ size: mockSizes[uri] ?? 0 })),
}));
const mockSaveAsync = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      renderAsync: async () => ({ saveAsync: mockSaveAsync }),
    })),
  },
}));

import { prepareImageForUpload, UnsupportedMediaError } from "../media-file";

describe("prepareImageForUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSizes).forEach((k) => delete mockSizes[k]);
  });

  it("uses the picker's real type and size", async () => {
    await expect(
      prepareImageForUpload({
        uri: "file:///a.png",
        fileName: "a.png",
        mimeType: "image/png",
        fileSize: 2048,
      }),
    ).resolves.toEqual({
      uri: "file:///a.png",
      contentType: "image/png",
      fileName: "a.png",
      sizeBytes: 2048,
    });
  });

  it("reads the size from disk when the picker doesn't provide it", async () => {
    mockSizes["file:///b.jpg"] = 5000;
    const file = await prepareImageForUpload({ uri: "file:///b.jpg" });
    expect(file).toMatchObject({ contentType: "image/jpeg", sizeBytes: 5000, fileName: "b.jpg" });
  });

  it("converts formats the API doesn't accept instead of mislabelling them", async () => {
    mockSaveAsync.mockResolvedValue({ uri: "file:///converted.jpg" });
    mockSizes["file:///converted.jpg"] = 9000;

    const file = await prepareImageForUpload({ uri: "file:///IMG_1.HEIC", mimeType: "image/heic" });

    expect(mockSaveAsync).toHaveBeenCalledWith(expect.objectContaining({ format: "jpeg" }));
    expect(file).toEqual({
      uri: "file:///converted.jpg",
      contentType: "image/jpeg",
      fileName: "IMG_1.jpg",
      sizeBytes: 9000,
    });
  });

  it("never fabricates a size for an unreadable file", async () => {
    await expect(prepareImageForUpload({ uri: "file:///missing.jpg" })).rejects.toBeInstanceOf(
      UnsupportedMediaError,
    );
  });
});
