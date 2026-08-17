import { apiClient } from "@core/network/api";
import {
  LogoutRequest,
  PhoneVerificationRequest,
  PhoneVerificationResponse,
  RefreshTokenRequest,
  ResendPhoneVerificationRequest,
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
}

export default AuthService;
