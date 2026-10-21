import { apiClient } from "@core/network/api";
import {
  PushDeviceResponseDto,
  RegisterPushDeviceDto,
} from "@shared/types/api";

export class PushService {
  static async registerDevice(
    installationId: string,
    data: RegisterPushDeviceDto,
  ): Promise<PushDeviceResponseDto> {
    const response = await apiClient.put<PushDeviceResponseDto>(
      `/me/push-devices/${installationId}`,
      data,
    );
    return response.data;
  }

  static async unregisterDevice(installationId: string): Promise<void> {
    await apiClient.delete(`/me/push-devices/${installationId}`);
  }
}
