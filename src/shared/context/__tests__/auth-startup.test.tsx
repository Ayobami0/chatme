jest.mock("@services/auth", () => ({
  AuthService: { getProfile: jest.fn(), logout: jest.fn() },
}));
jest.mock("@services/token-manager", () => ({
  TokenManager: {
    setOnUnauthenticatedListener: jest.fn(),
    loadSavedTokens: jest.fn(),
    clearTokens: jest.fn(async () => undefined),
    getRefreshToken: jest.fn(() => "r1"),
  },
}));
jest.mock("@services/storage", () => {
  const values: Record<string, unknown> = {};
  const StorageService = {
    get: jest.fn(async (key: string) => values[key]),
    save: jest.fn(async (key: string, value: unknown) => void (values[key] = value)),
    __values: values,
  };
  return {
    __esModule: true,
    default: StorageService,
    StorageKey: { OnboardingComplete: "onboardingComplete", CachedUser: "cachedUser" },
  };
});
jest.mock("@shared/session/end-session", () => ({ endSession: jest.fn(async () => undefined) }));

import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import React from "react";
import { AuthService } from "@services/auth";
import StorageService from "@services/storage";
import { TokenManager } from "@services/token-manager";
import { AuthProvider, useAuth } from "../auth-context";

const values = (StorageService as unknown as { __values: Record<string, unknown> }).__values;
const getProfile = AuthService.getProfile as jest.Mock;
const user = { id: "u1", profileComplete: true } as never;

const networkError = new AxiosError("Network Error", "ERR_NETWORK");
const rejected = new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
  status: 401,
  statusText: "",
  data: {},
  headers: {},
  config: { headers: new AxiosHeaders() },
});

const startApp = async () => {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  const { result } = await renderHook(() => useAuth(), { wrapper });
  await act(() => result.current.initialize());
  return result;
};

describe("session startup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(values).forEach((key) => delete values[key]);
    values.onboardingComplete = true;
    (TokenManager.loadSavedTokens as jest.Mock).mockResolvedValue({
      accessToken: "a1",
      refreshToken: "r1",
    });
  });

  it("keeps the session and cached user when offline", async () => {
    values.cachedUser = user;
    getProfile.mockRejectedValue(networkError);

    const auth = await startApp();

    expect(auth.current.authStatus).toBe("authenticated");
    expect(auth.current.offline).toBe(true);
    expect(auth.current.user).toEqual(user);
    expect(TokenManager.clearTokens).not.toHaveBeenCalled();
  });

  it("shows a recoverable error when offline with no cached user", async () => {
    getProfile.mockRejectedValue(networkError);

    const auth = await startApp();

    expect(auth.current.startupFailed).toBe(true);
    expect(TokenManager.clearTokens).not.toHaveBeenCalled();
  });

  it("ends the session when the server rejects the credentials", async () => {
    values.cachedUser = user;
    getProfile.mockRejectedValue(rejected);

    const auth = await startApp();

    expect(auth.current.authStatus).toBe("unauthenticated");
    expect(TokenManager.clearTokens).toHaveBeenCalled();
  });

  it("caches the profile when online", async () => {
    getProfile.mockResolvedValue(user);

    const auth = await startApp();

    expect(auth.current.authStatus).toBe("authenticated");
    expect(auth.current.offline).toBe(false);
    expect(values.cachedUser).toEqual(user);
  });
});
