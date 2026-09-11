import { apiClient } from "@core/network/api";
import {
  BlockListResponseDto,
  BlockResponseDto,
  LogoutRequest,
  PhoneVerificationRequest,
  PhoneVerificationResponse,
  RefreshTokenRequest,
  ResendPhoneVerificationRequest,
  SetProfileAvatarRequest,
  UserGetResponse,
  UserUpdateRequest,
  VerifyPhoneVerificationRequest,
  VerifyPhoneVerificationResponse,
} from "@shared/types/api";

export class AuthService {
  static async requestOTP(
    data: PhoneVerificationRequest,
  ): Promise<PhoneVerificationResponse> {
    const r = await apiClient.post<PhoneVerificationResponse>(
      "auth/otp/request",
      data,
    );
    return r.data;
  }

  static async verifyOTP(
    data: VerifyPhoneVerificationRequest,
  ): Promise<VerifyPhoneVerificationResponse> {
    const r = await apiClient.post<VerifyPhoneVerificationResponse>(
      "auth/otp/verify",
      data,
    );
    return r.data;
  }

  static async resendOTP(
    data: ResendPhoneVerificationRequest,
  ): Promise<PhoneVerificationResponse> {
    const r = await apiClient.post<PhoneVerificationResponse>(
      "auth/otp/resend",
      data,
    );
    return r.data;
  }

  static async refreshToken(
    data: RefreshTokenRequest,
  ): Promise<VerifyPhoneVerificationResponse> {
    const r = await apiClient.post<VerifyPhoneVerificationResponse>(
      "auth/refresh",
      data,
    );
    return r.data;
  }

  static async logout(data: LogoutRequest): Promise<void> {
    await apiClient.post("auth/logout", data);
  }

  static async updateProfile(
    data: UserUpdateRequest,
  ): Promise<UserGetResponse> {
    const r = await apiClient.patch<UserGetResponse>("/me", data);
    return r.data;
  }

  static async getProfile(): Promise<UserGetResponse> {
    const r = await apiClient.get<UserGetResponse>("/me");
    return r.data;
  }

  static async setProfileAvatar(
    data: SetProfileAvatarRequest,
  ): Promise<UserGetResponse> {
    const r = await apiClient.put<UserGetResponse>("/me/avatar", data);
    return r.data;
  }

  static async removeProfileAvatar(): Promise<void> {
    await apiClient.delete("/me/avatar");
  }

  static async getBlockedUsers(): Promise<BlockListResponseDto> {
    const r = await apiClient.get<BlockListResponseDto>("/me/blocks");
    return r.data;
  }

  static async blockUser(userId: string): Promise<BlockResponseDto> {
    const r = await apiClient.put<BlockResponseDto>(`/me/blocks/${userId}`);
    return r.data;
  }

  static async unblockUser(userId: string): Promise<void> {
    await apiClient.delete(`/me/blocks/${userId}`);
  }
}

export default AuthService;
