import { UserModel } from "./models";

export type AuthStatus = "unauthenticated" | "authenticated";

export type OnboardingStatus = "incomplete" | "complete";

export type ProfileStatus = "incomplete" | "complete";

export type ProfileFlowStage = "unknown" | "image" | "name";

export type StoredAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AppSessionState = {
  initialized: boolean;
  onboardingStatus: OnboardingStatus;
  authStatus: AuthStatus;
  profileStatus: ProfileStatus;
  profileFlowStage: ProfileFlowStage;
  user?: UserModel | undefined
};
