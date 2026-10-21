import axios from "axios";
import { AppConfig } from "@core/config";
import { isCredentialRejection } from "@core/network/errors";
import { log } from "@logging";
import StorageService, { StorageKey } from "./storage";
import { StoredAuthTokens } from "@shared/types/authState";
import { VerifyPhoneVerificationResponse } from "@shared/types/api";

let currentTokens: Partial<StoredAuthTokens> = {
  accessToken: undefined,
  refreshToken: undefined,
};

/**
 * Incremented whenever the session changes (login, logout, rejected credentials).
 * Async work captures it and discards its result if it changed meanwhile, so a
 * refresh that finishes after logout cannot restore the old credentials.
 */
let sessionGeneration = 0;

let refreshPromise: Promise<StoredAuthTokens | undefined> | null = null;
let unauthenticatedListener: (() => void) | null = null;
const tokenListeners = new Set<(tokens: Partial<StoredAuthTokens>) => void>();

const REFRESH_TIMEOUT_MS = 15_000;

const notifyTokens = () => tokenListeners.forEach((listener) => listener(currentTokens));

const persistTokens = async (tokens: StoredAuthTokens) => {
  currentTokens = tokens;
  notifyTokens();
  await StorageService.secureSave(StorageKey.AuthToken, tokens);
};

export class TokenManager {
  static setOnUnauthenticatedListener(listener: (() => void) | null): void {
    unauthenticatedListener = listener;
  }

  /** Subscribes to token changes (refresh, login, logout). Returns an unsubscribe function. */
  static subscribe(listener: (tokens: Partial<StoredAuthTokens>) => void): () => void {
    tokenListeners.add(listener);
    return () => tokenListeners.delete(listener);
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

  /** Starts a new session with `tokens`. Rejects if they could not be saved securely. */
  static async setTokens(tokens: StoredAuthTokens): Promise<void> {
    sessionGeneration++;
    refreshPromise = null;
    await persistTokens(tokens);
  }

  static async loadSavedTokens(): Promise<StoredAuthTokens | undefined> {
    const saved = await StorageService.secureGet<StoredAuthTokens>(
      StorageKey.AuthToken,
    );
    if (saved) {
      currentTokens = saved;
      notifyTokens();
    }
    return saved;
  }

  /**
   * Refreshes the access token. Concurrent callers share one request.
   *
   * - Resolves with the new tokens on success.
   * - Resolves `undefined` when the server rejected the refresh token; the session is ended.
   * - Rejects on network/server errors; the session and stored tokens are kept.
   */
  static async refreshToken(): Promise<StoredAuthTokens | undefined> {
    if (refreshPromise) {
      return refreshPromise;
    }

    const refreshToken = currentTokens.refreshToken;
    if (!refreshToken) {
      await TokenManager.clearTokens();
      return undefined;
    }

    const generation = sessionGeneration;
    const isCurrent = () => generation === sessionGeneration;

    const run = async (): Promise<StoredAuthTokens | undefined> => {
      try {
        const response = await axios.post<VerifyPhoneVerificationResponse>(
          `${AppConfig.apiBaseUrl}/auth/refresh`,
          { refreshToken },
          { timeout: REFRESH_TIMEOUT_MS },
        );

        if (!isCurrent()) return undefined;

        const newTokens: StoredAuthTokens = {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        };
        await persistTokens(newTokens);
        return newTokens;
      } catch (error) {
        if (!isCurrent()) return undefined;
        if (isCredentialRejection(error)) {
          await TokenManager.clearTokens();
          return undefined;
        }
        throw error;
      } finally {
        if (refreshPromise === promise) refreshPromise = null;
      }
    };

    const promise = run();
    refreshPromise = promise;
    return promise;
  }

  /** Ends the session: clears memory and secure storage, then notifies the app. */
  static async clearTokens(): Promise<void> {
    sessionGeneration++;
    refreshPromise = null;
    currentTokens = { accessToken: undefined, refreshToken: undefined };
    notifyTokens();

    try {
      await StorageService.secureRemove(StorageKey.AuthToken);
    } catch (error) {
      log.error("Unable to remove stored credentials", (error as Error)?.message);
      throw error;
    } finally {
      unauthenticatedListener?.();
    }
  }
}
