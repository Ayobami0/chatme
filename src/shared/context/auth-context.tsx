import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { AppSessionState, StoredAuthTokens } from "@shared/types/authState";
import { UserModel } from "@shared/types/models";
import { TokenManager } from "@services/token-manager";
import { AuthService } from "@services/auth";
import StorageService, { StorageKey } from "@services/storage";
import { endSession } from "@shared/session/end-session";
import { isCredentialRejection } from "@core/network/errors";
import { withTimeout } from "@shared/utils/async";
import { log } from "@logging";

const LOGOUT_REVOKE_TIMEOUT_MS = 5_000;
const OFFLINE_RETRY_INTERVAL_MS = 30_000;

interface AuthContextType extends AppSessionState {
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<StoredAuthTokens | undefined>;
  /** Starts a session. Rejects if the credentials could not be stored securely. */
  setAuthState: (props: {
    user: UserModel;
    refreshToken: string;
    accessToken: string;
  }) => Promise<void>;
  /** Replaces the signed-in user with a fresh profile from the server. */
  setUser: (user: UserModel) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const profileState = (user: UserModel) => ({
  user,
  profileStatus: user.profileComplete ? ("complete" as const) : ("incomplete" as const),
});

const cacheUser = (user: UserModel) =>
  StorageService.save(StorageKey.CachedUser, user).catch(() => undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<AppSessionState>({
    initialized: false,
    onboardingStatus: "incomplete",
    authStatus: "unauthenticated",
    profileFlowStage: "unknown",
    profileStatus: "incomplete",
    user: undefined,
    offline: false,
    startupFailed: false,
  });

  const queryClient = useQueryClient();
  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = sessionState.user?.id;
  const endingSession = useRef<Promise<void> | null>(null);

  // The one path for ending a session, whether from logout or from rejected credentials.
  // Concurrent callers share the same run.
  const endLocalSession = useCallback(() => {
    endingSession.current ??= (async () => {
      try {
        const cachedUser = await StorageService.get<UserModel>(
          StorageKey.CachedUser,
        ).catch(() => undefined);
        await endSession(queryClient, userIdRef.current ?? cachedUser?.id);
      } finally {
        setSessionState((prev) => ({
          ...prev,
          authStatus: "unauthenticated",
          user: undefined,
          profileStatus: "incomplete",
          offline: false,
          startupFailed: false,
        }));
        endingSession.current = null;
      }
    })();
    return endingSession.current;
  }, [queryClient]);

  useEffect(() => {
    TokenManager.setOnUnauthenticatedListener(() => void endLocalSession());
    return () => TokenManager.setOnUnauthenticatedListener(null);
  }, [endLocalSession]);

  /**
   * Loads the profile for the stored credentials. Only a credential rejection ends
   * the session; connectivity or server errors fall back to the cached profile.
   */
  const revalidateProfile = useCallback(async () => {
    try {
      const profile = await AuthService.getProfile();
      void cacheUser(profile);
      setSessionState((prev) => ({
        ...prev,
        ...profileState(profile),
        initialized: true,
        onboardingStatus: "complete",
        authStatus: "authenticated",
        offline: false,
        startupFailed: false,
      }));
    } catch (error) {
      if (isCredentialRejection(error)) {
        if (TokenManager.getRefreshToken()) {
          await TokenManager.clearTokens().catch(() => undefined);
        }
        await endLocalSession();
        setSessionState((prev) => ({
          ...prev,
          initialized: true,
          onboardingStatus: "complete",
        }));
        return;
      }

      log.warn("Profile unavailable; continuing offline", (error as Error)?.message);
      const cachedUser = await StorageService.get<UserModel>(
        StorageKey.CachedUser,
      ).catch(() => undefined);

      setSessionState((prev) => {
        const user = prev.user ?? cachedUser;
        return user
          ? {
              ...prev,
              ...profileState(user),
              initialized: true,
              onboardingStatus: "complete",
              authStatus: "authenticated",
              offline: true,
              startupFailed: false,
            }
          : {
              ...prev,
              initialized: true,
              onboardingStatus: "complete",
              offline: true,
              startupFailed: true,
            };
      });
    }
  }, [endLocalSession]);

  // While offline, retry periodically and whenever the app returns to the foreground.
  const shouldRetry = sessionState.offline && sessionState.authStatus === "authenticated";
  useEffect(() => {
    if (!shouldRetry) return;

    const retry = () => void revalidateProfile();
    const timer = setInterval(retry, OFFLINE_RETRY_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") retry();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [shouldRetry, revalidateProfile]);

  const logout = async () => {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      // Best effort: revoke server-side, but never block logout on the network.
      await withTimeout(
        AuthService.logout({ refreshToken }),
        LOGOUT_REVOKE_TIMEOUT_MS,
      ).catch((error) => log.warn("Server logout failed", error?.message));
    }

    await TokenManager.clearTokens().catch(() => undefined);
    await endLocalSession();
  };

  const refreshTokens = async () => {
    return await TokenManager.refreshToken();
  };

  const initialize = async () => {
    setSessionState((prev) => ({ ...prev, startupFailed: false }));

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

      await revalidateProfile();
    } catch (error) {
      // Local storage failed; don't destroy credentials we couldn't even read.
      log.error("Unable to restore session", (error as Error)?.message);
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
    await TokenManager.setTokens({
      accessToken: props.accessToken,
      refreshToken: props.refreshToken,
    });
    void cacheUser(props.user);
    setSessionState((prev) => ({
      ...prev,
      ...profileState(props.user),
      authStatus: "authenticated",
      offline: false,
      startupFailed: false,
    }));
  };

  const setUser = (user: UserModel) => {
    void cacheUser(user);
    setSessionState((prev) => ({ ...prev, ...profileState(user) }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...sessionState,
        initialize,
        logout,
        refreshTokens,
        setAuthState,
        setUser,
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
