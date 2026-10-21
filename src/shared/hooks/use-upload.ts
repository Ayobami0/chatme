import { useMutation, UseMutationOptions, UseMutationResult } from "@tanstack/react-query";
import { MediaService, UploadMediaInput } from "@services/media";
import { MediaAssetResponseDto } from "@shared/types/api";

export type UploadParticulars = UploadMediaInput;

export interface UseUploadOptions
  extends Omit<
    UseMutationOptions<MediaAssetResponseDto, Error, UploadParticulars>,
    "mutationFn"
  > {}

export function useUpload(
  initialParticulars?: Partial<UploadParticulars>,
  options?: UseUploadOptions,
) {
  const mutation = useMutation<MediaAssetResponseDto, Error, UploadParticulars>({
    mutationFn: async (particulars?: UploadParticulars) => {
      const mergedInput: UploadParticulars = {
        ...initialParticulars,
        ...particulars,
      } as UploadParticulars;

      if (!mergedInput.uri) {
        throw new Error("File URI is required for upload");
      }

      return await MediaService.uploadMedia(mergedInput);
    },
    ...options,
  });

  const upload = (particulars?: string | UploadParticulars) => {
    let input: UploadParticulars;
    if (typeof particulars === "string") {
      input = { ...initialParticulars, uri: particulars } as UploadParticulars;
    } else {
      input = { ...initialParticulars, ...particulars } as UploadParticulars;
    }
    return mutation.mutateAsync(input);
  };

  return {
    upload,
    uploadAsync: upload,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    status: mutation.status,
    file: mutation.data ?? null,
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    isIdle: mutation.isIdle,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    reset: mutation.reset,
  };
}
