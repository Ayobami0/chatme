import { create } from "zustand";
import { combine } from "zustand/middleware";
import { AppSessionState, StoredAuthTokens } from "@shared/types/authState";
import { AuthService } from "@services/auth";
import StorageService, { StorageKey } from "@services/storage";
import { UserModel } from "@shared/types/models";
import { useTokenStore } from "./auth";

export const useSessionStore = create(
  combine(
    {
      initialized: false,
      onboardingStatus: "incomplete",
      authStatus: "unauthenticated",
      profileFlowStage: "unknown",
      profileStatus: "incomplete",
      user: undefined as UserModel | undefined,
    } as AppSessionState,

    (set) => ({
      logout: async () => {
        await StorageService.secureRemove(StorageKey.AuthToken);
        useTokenStore.getState().clearAuth();
        set({
          authStatus: "unauthenticated",
          user: undefined,
          profileStatus: "incomplete",
        });
      },

      initialize: async () => {
        try {
          const onboardingComplete = await StorageService.get<boolean>(
            StorageKey.OnboardingComplete,
          );

          if (!onboardingComplete) {
            set({
              initialized: true,
              onboardingStatus: "incomplete",
            });

            return;
          }

          set({
            onboardingStatus: "complete",
          });

          const storedTokens = await StorageService.secureGet<StoredAuthTokens>(
            StorageKey.AuthToken,
          );

          if (!storedTokens) {
            set({
              initialized: true,
              authStatus: "unauthenticated",
            });

            return;
          }
          useTokenStore.getState().setAuth(storedTokens);
          const profile: UserModel = await AuthService.getProfile();

          if (!profile) {
            set({
              initialized: true,
              authStatus: "unauthenticated",
            });

            return;
          }

          set({
            authStatus: "authenticated",
          });


          if (!profile.profileComplete) {
            set({
              initialized: true,
              profileStatus: "incomplete",
              user: profile,
            });

            return;
          }

          set({
            initialized: true,
            profileStatus: "complete",
            user: profile,
          });
        } catch (error) {
          await StorageService.secureRemove(StorageKey.AuthToken);

          set({
            initialized: true,
            authStatus: "unauthenticated",
            user: undefined,
            profileStatus: "incomplete",
          });
        }
      },

      setAuthState: async (props: {
        user: UserModel;
        refreshToken: string;
        accessToken: string;
      }) => {
        await StorageService.secureSave(StorageKey.AuthToken, {
          accessToken: props.accessToken,
          refreshToken: props.refreshToken,
        });
        useTokenStore.getState().setAuth({
          accessToken: props.accessToken,
          refreshToken: props.refreshToken,
        });
        set({ user: props.user });
      },
    }),
  ),
);
