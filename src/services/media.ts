import { apiClient } from "@core/network/api";
import {
  CreateMediaUploadDto,
  CreateMediaUploadResponseDto,
  MediaAssetResponseDto,
} from "@shared/types/api";

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
}
