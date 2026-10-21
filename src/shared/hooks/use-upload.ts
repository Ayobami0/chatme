import { useMutation } from "@tanstack/react-query";
import { MediaService } from "@services/media";
import { MediaAssetResponseDto, MediaPurpose } from "@shared/types/api";
import { PickedImage, prepareImageForUpload } from "@shared/utils/media-file";

/**
 * Uploads a picked image for `purpose`: converts/validates it, then runs the
 * authorize → storage upload → complete sequence. Resolves with the completed asset.
 */
export function useUpload(purpose: MediaPurpose) {
  const mutation = useMutation<
    MediaAssetResponseDto,
    Error,
    PickedImage & { clientUploadId?: string }
  >({
    mutationFn: async ({ clientUploadId, ...image }) => {
      const file = await prepareImageForUpload(image);
      return MediaService.uploadMedia({
        uri: file.uri,
        purpose,
        contentType: file.contentType,
        originalFilename: file.fileName,
        sizeBytes: file.sizeBytes,
        clientUploadId,
      });
    },
  });

  return {
    upload: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
