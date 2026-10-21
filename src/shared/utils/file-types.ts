// utils/file-content-type.ts

// ─────────────────────────────────────────────────────────────
// Allowed content types (must match backend whitelist exactly)
// ─────────────────────────────────────────────────────────────

export const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/aac",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export type FileCategory = "image" | "audio" | "video" | "pdf" | "document" | "other";

function isAllowedContentType(contentType?: string | null): contentType is AllowedContentType {
  return !!contentType && (ALLOWED_CONTENT_TYPES as readonly string[]).includes(contentType);
}

// ─────────────────────────────────────────────────────────────
// Content type -> label / extension / category
// ─────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<AllowedContentType, string> = {
  "image/jpeg": "JPEG Image",
  "image/png": "PNG Image",
  "image/webp": "WebP Image",
  "audio/aac": "AAC Audio",
  "audio/mp4": "M4A Audio",
  "audio/m4a": "M4A Audio",
  "audio/x-m4a": "M4A Audio",
  "audio/mpeg": "MP3 Audio",
  "audio/ogg": "OGG Audio",
  "audio/wav": "WAV Audio",
  "audio/x-wav": "WAV Audio",
  "video/mp4": "MP4 Video",
  "video/quicktime": "MOV Video",
  "video/webm": "WebM Video",
  "application/pdf": "PDF Document",
  "text/plain": "Text File",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint Presentation",
};

const CONTENT_TYPE_EXTENSIONS: Record<AllowedContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/aac": "aac",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

/** "image/png" -> "png". Returns "" for anything outside the allowed list. */
export function getExtensionFromContentType(contentType?: string | null): string {
  if (!isAllowedContentType(contentType)) return "";
  return CONTENT_TYPE_EXTENSIONS[contentType];
}

/** "application/pdf" -> "PDF Document". Returns "File" for anything outside the allowed list. */
export function getContentTypeLabel(contentType?: string | null): string {
  if (!isAllowedContentType(contentType)) return "File";
  return CONTENT_TYPE_LABELS[contentType];
}

/** Buckets an allowed MIME type into a broad category for icon/layout logic. */
export function getFileCategory(contentType?: string | null): FileCategory {
  if (!isAllowedContentType(contentType)) return "other";

  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("video/")) return "video";
  if (contentType === "application/pdf") return "pdf";

  if (
    contentType === "text/plain" ||
    contentType.includes("wordprocessingml") ||
    contentType.includes("spreadsheetml") ||
    contentType.includes("presentationml")
  ) {
    return "document";
  }

  return "other";
}

// ─────────────────────────────────────────────────────────────
// Extension -> content type (for deriving MIME type from a filename/uri,
// e.g. from expo-media-library's AssetInfo, which has no MIME field)
// ─────────────────────────────────────────────────────────────

const EXTENSION_TO_CONTENT_TYPE: Record<string, AllowedContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  aac: "audio/aac",
  m4a: "audio/m4a",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
  txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/**
 * Derives an allowed MIME type from a filename/uri extension.
 * Useful for expo-media-library's AssetInfo, which has no contentType field.
 * Returns undefined if the extension isn't in the allowed list.
 */
export function getContentTypeFromAsset(asset: {
  filename?: string;
  uri?: string;
}): AllowedContentType | undefined {
  const source = asset.filename ?? asset.uri ?? "";
  const ext = source.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;

  return EXTENSION_TO_CONTENT_TYPE[ext];
}
