// AUTH
export interface PhoneVerificationRequest {
  phoneNumber: string;
}

export interface PhoneVerificationResponse {
  challengeId: string;
  phoneNumberMasked: string;
  expiresInSeconds: number;
  resendInSeconds: number;
  codeLength: number;
}

export interface ResendPhoneVerificationRequest {
  challengeId: string;
}

export interface VerifyPhoneVerificationRequest {
  challengeId: string;
  code: string;
  device: {
    name: string;
    platform: string;
  };
}

export interface VerifyPhoneVerificationResponse {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: UserGetResponse;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// PROFILE
export interface UserGetResponse {
  id: string;
  phoneNumber: string;
  displayName: string;
  avatarUrl: string;
  profileComplete: boolean;
  createdAt: string;
}

export interface UserUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
}
