import StorageService, { StorageKey } from "./storage";
import { StoredAuthTokens } from "@shared/types/authState";

let currentTokens: Partial<StoredAuthTokens> = {
  accessToken: undefined,
  refreshToken: undefined,
};

export class TokenManager {
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

  static clearTokens(): void {
    currentTokens = { accessToken: undefined, refreshToken: undefined };
    void StorageService.secureRemove(StorageKey.AuthToken);
  }
}
