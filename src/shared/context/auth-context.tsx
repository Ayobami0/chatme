import React, { createContext, useContext, useState } from "react";
import { AppSessionState, StoredAuthTokens } from "@shared/types/authState";
import { UserModel } from "@shared/types/models";
import { TokenManager } from "@services/token-manager";
import { AuthService } from "@services/auth";
import StorageService, { StorageKey } from "@services/storage";
import { useCacheStore } from "@shared/store/cache";

interface AuthContextType extends AppSessionState {
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<StoredAuthTokens | undefined>;
  setAuthState: (props: {
    user: UserModel;
    refreshToken: string;
    accessToken: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<AppSessionState>({
    initialized: false,
    onboardingStatus: "incomplete",
    authStatus: "unauthenticated",
    profileFlowStage: "unknown",
    profileStatus: "incomplete",
    user: undefined,
  });

  const logout = async () => {
    TokenManager.clearTokens();
    await useCacheStore.getState().clearCache();
    setSessionState((prev) => ({
      ...prev,
      authStatus: "unauthenticated",
      user: undefined,
      profileStatus: "incomplete",
    }));
  };

  const refreshTokens = async () => {
    return await TokenManager.refreshToken();
  };

  const initialize = async () => {
    try {
      const onboardingComplete = await StorageService.get<boolean>(
        StorageKey.OnboardingComplete,
      );

      if (!onboardingComplete) {
        setSessionState((prev) => ({
          ...prev,
          initialized: true,
          onboardingStatus: "incomplete",
        }));
        return;
      }

      const storedTokens = await TokenManager.loadSavedTokens();

      if (!storedTokens) {
        setSessionState((prev) => ({
          ...prev,
          initialized: true,
          onboardingStatus: "complete",
          authStatus: "unauthenticated",
        }));
        return;
      }

      const profile: UserModel = await AuthService.getProfile();

      if (!profile) {
        setSessionState((prev) => ({
          ...prev,
          initialized: true,
          onboardingStatus: "complete",
          authStatus: "unauthenticated",
        }));
        return;
      }

      setSessionState((prev) => ({
        ...prev,
        initialized: true,
        onboardingStatus: "complete",
        authStatus: "authenticated",
        user: profile,
        profileStatus: profile.profileComplete ? "complete" : "incomplete",
      }));
    } catch {
      TokenManager.clearTokens();
      setSessionState((prev) => ({
        ...prev,
        initialized: true,
        authStatus: "unauthenticated",
        user: undefined,
        profileStatus: "incomplete",
      }));
    }
  };

  const setAuthState = async (props: {
    user: UserModel;
    refreshToken: string;
    accessToken: string;
  }) => {
    TokenManager.setTokens({
      accessToken: props.accessToken,
      refreshToken: props.refreshToken,
    });
    setSessionState((prev) => ({
      ...prev,
      authStatus: "authenticated",
      user: props.user,
      profileStatus: props.user.profileComplete ? "complete" : "incomplete",
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...sessionState,
        initialize,
        logout,
        refreshTokens,
        setAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
