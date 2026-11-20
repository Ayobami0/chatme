import { useMutation } from "@tanstack/react-query";
import { MediaService } from "@services/media";
import { SessionHandle, TokenManager } from "@services/token-manager";
import { MediaAssetResponseDto, MediaPurpose } from "@shared/types/api";
import { PickedImage, prepareImageForUpload } from "@shared/utils/media-file";

/**
 * Uploads a picked image for `purpose`: converts/validates it, then runs the
 * staged authorize → storage upload → complete sequence (see `MediaService.uploadMedia`)
 * within the session that started it. Resolves with the completed asset.
 */
export function useUpload(purpose: MediaPurpose) {
  const mutation = useMutation<
    MediaAssetResponseDto,
    Error,
    PickedImage & { clientUploadId?: string; session?: SessionHandle }
  >({
    mutationFn: async ({ clientUploadId, session = TokenManager.captureSession(), ...image }) => {
      const file = await prepareImageForUpload(image);
      return MediaService.uploadMedia(
        {
          uri: file.uri,
          purpose,
          contentType: file.contentType,
          originalFilename: file.fileName,
          sizeBytes: file.sizeBytes,
          clientUploadId,
        },
        { session },
      );
    },
  });

  return {
    upload: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
