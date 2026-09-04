import axios from "axios";
import { AppConfig } from "@core/config";
import StorageService, { StorageKey } from "./storage";
import { StoredAuthTokens } from "@shared/types/authState";
import { VerifyPhoneVerificationResponse } from "@shared/types/api";

let currentTokens: Partial<StoredAuthTokens> = {
  accessToken: undefined,
  refreshToken: undefined,
};

let refreshPromise: Promise<StoredAuthTokens | undefined> | null = null;
let unauthenticatedListener: (() => void) | null = null;

export class TokenManager {
  static setOnUnauthenticatedListener(listener: (() => void) | null): void {
    unauthenticatedListener = listener;
  }

  static getAccessToken(): string | undefined {
    return currentTokens.accessToken;
  }

  static getRefreshToken(): string | undefined {
    return currentTokens.refreshToken;
  }

  static getTokens(): Partial<StoredAuthTokens> {
    return currentTokens;
  }

  static setTokens(tokens: StoredAuthTokens): void {
    currentTokens = tokens;
    if (tokens.accessToken && tokens.refreshToken) {
      void StorageService.secureSave(StorageKey.AuthToken, tokens);
    }
  }

  static async loadSavedTokens(): Promise<StoredAuthTokens | undefined> {
    const saved = await StorageService.secureGet<StoredAuthTokens>(
      StorageKey.AuthToken,
    );
    if (saved) {
      currentTokens = saved;
    }
    return saved;
  }

  static async refreshToken(): Promise<StoredAuthTokens | undefined> {
    if (refreshPromise) {
      return refreshPromise;
    }

    const refreshToken = currentTokens.refreshToken;
    if (!refreshToken) {
      TokenManager.clearTokens();
      return undefined;
    }

    refreshPromise = (async () => {
      try {
        const response = await axios.post<VerifyPhoneVerificationResponse>(
          `${AppConfig.apiBaseUrl}/auth/refresh`,
          { refreshToken },
        );

        const newTokens: StoredAuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };

        TokenManager.setTokens(newTokens);
        return newTokens;
      } catch (error) {
        TokenManager.clearTokens();
        return undefined;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  }

  static clearTokens(): void {
    currentTokens = { accessToken: undefined, refreshToken: undefined };
    void StorageService.secureRemove(StorageKey.AuthToken);
    if (unauthenticatedListener) {
      unauthenticatedListener();
    }
  }
}
