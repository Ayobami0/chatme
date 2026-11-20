jest.mock("@services/auth", () => ({
  AuthService: { getProfile: jest.fn(), logout: jest.fn() },
}));
// A session counter like the real TokenManager's: login and logout start a new session.
let mockGeneration = 0;
jest.mock("@services/token-manager", () => ({
  TokenManager: {
    setOnUnauthenticatedListener: jest.fn(),
    loadSavedTokens: jest.fn(),
    clearTokens: jest.fn(async () => void mockGeneration++),
    setTokens: jest.fn(async () => void mockGeneration++),
    getRefreshToken: jest.fn(() => "r1"),
    getTokens: jest.fn(() => ({ accessToken: "a1", refreshToken: "r1" })),
    captureSession: () => {
      const generation = mockGeneration;
      const isCurrent = () => generation === mockGeneration;
      return {
        generation,
        isCurrent,
        assertCurrent: () => {
          if (!isCurrent()) throw new (jest.requireActual("@core/network/errors").StaleSessionError)();
        },
      };
    },
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
const mockCalls: string[] = [];
jest.mock("@features/notifications/push-registration", () => ({
  unregisterFromPushNotifications: jest.fn(async (token: string) => void mockCalls.push(`unregister-push:${token}`)),
}));

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

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};
const userB = { id: "uB", profileComplete: true } as never;

describe("logout", () => {
  it("ends the local session first, then cleans up remotely with the old credentials", async () => {
    mockCalls.length = 0;
    getProfile.mockResolvedValue(user);
    (AuthService.logout as jest.Mock).mockImplementation(
      async ({ refreshToken }: { refreshToken: string }) => void mockCalls.push(`revoke:${refreshToken}`),
    );
    (TokenManager.clearTokens as jest.Mock).mockImplementation(async () => {
      mockGeneration++;
      mockCalls.push("clear-tokens");
    });

    const auth = await startApp();
    await act(() => auth.current.logout());
    expect(auth.current.authStatus).toBe("unauthenticated");
    await act(flush);

    expect(mockCalls).toEqual(["clear-tokens", "unregister-push:a1", "revoke:r1"]);
  });

  it("does not wait for a hanging server to sign the user out", async () => {
    getProfile.mockResolvedValue(user);
    (AuthService.logout as jest.Mock).mockReturnValue(new Promise(() => undefined));

    const auth = await startApp();
    await act(() => auth.current.logout());

    expect(auth.current.authStatus).toBe("unauthenticated");
  });
});

describe("profile revalidation across sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(values).forEach((key) => delete values[key]);
    values.onboardingComplete = true;
    (TokenManager.loadSavedTokens as jest.Mock).mockResolvedValue({
      accessToken: "a1",
      refreshToken: "r1",
    });
  });

  it("ignores A's delayed profile once B has signed in", async () => {
    const profileA = deferred<unknown>();
    getProfile.mockReturnValueOnce(profileA.promise);

    const auth = await startAppWithoutWaiting();
    await act(() =>
      auth.current.setAuthState({ user: userB, accessToken: "b", refreshToken: "rb" }),
    );
    await act(async () => profileA.resolve(user));

    expect(auth.current.user).toEqual(userB);
    expect(values.cachedUser).toEqual(userB);
  });

  it("does not log B out when A's delayed profile request is rejected", async () => {
    const profileA = deferred<unknown>();
    getProfile.mockReturnValueOnce(profileA.promise);

    const auth = await startAppWithoutWaiting();
    await act(() =>
      auth.current.setAuthState({ user: userB, accessToken: "b", refreshToken: "rb" }),
    );
    (TokenManager.clearTokens as jest.Mock).mockClear();
    await act(async () => profileA.reject(rejected));

    expect(TokenManager.clearTokens).not.toHaveBeenCalled();
    expect(auth.current.authStatus).toBe("authenticated");
    expect(auth.current.user).toEqual(userB);
  });
});

/** Starts the app and returns while the startup profile request is still in flight. */
async function startAppWithoutWaiting() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
  const { result } = await renderHook(() => useAuth(), { wrapper });
  // Not awaited: the profile request stays in flight while the test continues.
  act(() => {
    void result.current.initialize();
  });
  await act(flush);
  expect(getProfile).toHaveBeenCalledTimes(1);
  return result;
}
