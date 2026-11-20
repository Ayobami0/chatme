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
import {
  AppSessionState,
  ProfileFlowStage,
  StoredAuthTokens,
} from "@shared/types/authState";
import { UserModel } from "@shared/types/models";
import { SessionHandle, TokenManager } from "@services/token-manager";
import { AuthService } from "@services/auth";
import StorageService, { StorageKey } from "@services/storage";
import { endSession } from "@shared/session/end-session";
import { isCredentialRejection, isStaleSession } from "@core/network/errors";
import { withTimeout } from "@shared/utils/async";
import { log } from "@logging";
import { unregisterFromPushNotifications } from "@features/notifications/push-registration";

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
  /**
   * Replaces the signed-in user with a fresh profile from the server. Pass the
   * session that requested it so a late response can't overwrite a newer user.
   */
  setUser: (user: UserModel, session?: SessionHandle) => void;
  /** Records the next profile-setup step so it survives restarts. */
  setProfileFlowStage: (stage: ProfileFlowStage) => Promise<void>;
  /** Ends profile setup; route guards then move the user into the app. */
  completeProfileSetup: () => Promise<void>;
}

/** Which route group a session belongs in. Drives the root `Stack.Protected` guards. */
export type SessionStage = "signed-out" | "profile-setup" | "app";

export function getSessionStage(
  state: Pick<AppSessionState, "authStatus" | "profileStatus" | "profileFlowStage">,
): SessionStage {
  if (state.authStatus !== "authenticated") return "signed-out";
  // An optional step (the photo) can remain after the server considers the profile complete.
  const setupPending = state.profileStatus !== "complete" || state.profileFlowStage === "image";
  return setupPending ? "profile-setup" : "app";
}

const AuthContext = createContext<AuthContextType | null>(null);

const profileState = (user: UserModel) => ({
  user,
  profileStatus: user.profileComplete ? ("complete" as const) : ("incomplete" as const),
});

/** Best-effort server cleanup for a session that has already ended locally. */
async function cleanUpRemoteSession(ended: { accessToken?: string; refreshToken?: string }) {
  if (ended.accessToken) {
    // The push registration is bound to the login being revoked; unregister it first.
    await withTimeout(
      unregisterFromPushNotifications(ended.accessToken),
      LOGOUT_REVOKE_TIMEOUT_MS,
    ).catch((error) => log.warn("Push unregister failed", error?.message));
  }
  if (ended.refreshToken) {
    await withTimeout(
      AuthService.logout({ refreshToken: ended.refreshToken }),
      LOGOUT_REVOKE_TIMEOUT_MS,
    ).catch((error) => log.warn("Server logout failed", error?.message));
  }
}

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
          profileFlowStage: "unknown",
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
    // A slow response must not land in a newer session (another account, or a re-login).
    const session = TokenManager.captureSession();
    try {
      const profile = await AuthService.getProfile({ sessionGeneration: session.generation });
      if (!session.isCurrent()) return;
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
      if (isStaleSession(error) || !session.isCurrent()) return;

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
      if (!session.isCurrent()) return;

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
    // Capture the ending session's credentials, then end it locally first: nothing it
    // started can act or publish after this point, and the UI moves on immediately.
    const { accessToken, refreshToken } = TokenManager.getTokens();
    await TokenManager.clearTokens().catch(() => undefined);
    await endLocalSession();

    // Remote cleanup runs in the background with the captured credentials (never the
    // current session's), each step bounded, so it can't block or affect a newer login.
    void cleanUpRemoteSession({ accessToken, refreshToken });
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
      const profileFlowStage =
        (await StorageService.get<ProfileFlowStage>(StorageKey.ProfileFlowStage)) ?? "unknown";
      setSessionState((prev) => ({ ...prev, profileFlowStage }));

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

  const setUser = (user: UserModel, session?: SessionHandle) => {
    if (session && !session.isCurrent()) return;
    void cacheUser(user);
    setSessionState((prev) => ({ ...prev, ...profileState(user) }));
  };

  const setProfileFlowStage = async (profileFlowStage: ProfileFlowStage) => {
    await StorageService.save(StorageKey.ProfileFlowStage, profileFlowStage).catch(() => undefined);
    setSessionState((prev) => ({ ...prev, profileFlowStage }));
  };

  const completeProfileSetup = async () => {
    await StorageService.remove(StorageKey.ProfileFlowStage).catch(() => undefined);
    setSessionState((prev) => ({ ...prev, profileFlowStage: "unknown" }));
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
        setProfileFlowStage,
        completeProfileSetup,
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
