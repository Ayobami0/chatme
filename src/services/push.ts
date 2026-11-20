import type { AxiosRequestConfig } from "axios";
import { apiClient } from "@core/network/api";
import {
  PushDeviceResponseDto,
  RegisterPushDeviceDto,
} from "@shared/types/api";

export class PushService {
  static async registerDevice(
    installationId: string,
    data: RegisterPushDeviceDto,
    config?: AxiosRequestConfig,
  ): Promise<PushDeviceResponseDto> {
    const response = await apiClient.put<PushDeviceResponseDto>(
      `/me/push-devices/${installationId}`,
      data,
      config,
    );
    return response.data;
  }

  static async unregisterDevice(
    installationId: string,
    config?: AxiosRequestConfig,
  ): Promise<void> {
    await apiClient.delete(`/me/push-devices/${installationId}`, config);
  }
}
