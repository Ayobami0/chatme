import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import {
  ALLOWED_CONTENT_TYPES,
  AllowedContentType,
  getContentTypeFromAsset,
} from "./file-types";

/** A local file with the real metadata the upload API requires. */
export type LocalMediaFile = {
  uri: string;
  contentType: AllowedContentType;
  sizeBytes: number;
  fileName: string;
};

/** Whatever a picker tells us about the file; missing fields are read from disk. */
export type PickedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

export class UnsupportedMediaError extends Error {}

const isAllowed = (type?: string | null): type is AllowedContentType =>
  !!type && (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);

const fileNameOf = (uri: string) => uri.split("/").pop()?.split("?")[0] || "image.jpg";

const sizeOf = (uri: string) => {
  const size = new File(uri).size;
  if (!size) throw new UnsupportedMediaError("The selected file couldn't be read.");
  return size;
};

/**
 * Prepares a picked image for upload. Formats the API doesn't accept (e.g. HEIC from
 * the iOS library) are converted to JPEG rather than mislabelled, and the size is
 * taken from the picker or the file itself, never guessed.
 */
export async function prepareImageForUpload(image: PickedImage): Promise<LocalMediaFile> {
  const fileName = image.fileName || fileNameOf(image.uri);
  const contentType = isAllowed(image.mimeType)
    ? image.mimeType
    : getContentTypeFromAsset({ filename: fileName, uri: image.uri });

  if (contentType?.startsWith("image/")) {
    return {
      uri: image.uri,
      contentType,
      fileName,
      sizeBytes: image.fileSize || sizeOf(image.uri),
    };
  }

  const rendered = await ImageManipulator.manipulate(image.uri).renderAsync();
  const converted = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });

  return {
    uri: converted.uri,
    contentType: "image/jpeg",
    fileName: fileName.replace(/\.[^.]+$/, "") + ".jpg",
    sizeBytes: sizeOf(converted.uri),
  };
}
