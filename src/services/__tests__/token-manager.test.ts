jest.mock("@services/storage", () => {
  const store = new Map<string, unknown>();
  const StorageService = {
    secureSave: jest.fn(async (key: string, value: unknown) => void store.set(key, value)),
    secureGet: jest.fn(async (key: string) => store.get(key)),
    secureRemove: jest.fn(async (key: string) => void store.delete(key)),
    __store: store,
  };
  return { __esModule: true, default: StorageService, StorageService, StorageKey: { AuthToken: "authToken" } };
});

import axios, { AxiosError, AxiosHeaders } from "axios";
import StorageService from "@services/storage";
import { TokenManager } from "@services/token-manager";

const storage = StorageService as unknown as {
  secureSave: jest.Mock;
  __store: Map<string, unknown>;
};
const post = jest.spyOn(axios, "post");

const httpError = (status?: number) =>
  new AxiosError(
    "request failed",
    status ? "ERR_BAD_RESPONSE" : "ERR_NETWORK",
    undefined,
    undefined,
    status
      ? { status, statusText: "", data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
      : undefined,
  );

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

const signIn = () => TokenManager.setTokens({ accessToken: "a1", refreshToken: "r1" });

describe("TokenManager", () => {
  let onUnauthenticated: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    storage.__store.clear();
    onUnauthenticated = jest.fn();
    TokenManager.setOnUnauthenticatedListener(onUnauthenticated);
    await signIn();
  });

  it("shares one refresh request between concurrent callers", async () => {
    post.mockResolvedValue({ data: { accessToken: "a2", refreshToken: "r2" } });

    const results = await Promise.all([
      TokenManager.refreshToken(),
      TokenManager.refreshToken(),
      TokenManager.refreshToken(),
    ]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(results.every((t) => t?.accessToken === "a2")).toBe(true);
  });

  it("does not restore credentials when a refresh finishes after logout", async () => {
    const response = deferred<unknown>();
    post.mockReturnValue(response.promise as never);

    const refreshing = TokenManager.refreshToken();
    await TokenManager.clearTokens();
    response.resolve({ data: { accessToken: "stale", refreshToken: "stale" } });

    await expect(refreshing).resolves.toBeUndefined();
    expect(TokenManager.getAccessToken()).toBeUndefined();
    expect(storage.__store.has("authToken")).toBe(false);
  });

  it("does not let an old refresh overwrite a newer sign-in", async () => {
    const response = deferred<unknown>();
    post.mockReturnValue(response.promise as never);

    const refreshing = TokenManager.refreshToken();
    await TokenManager.setTokens({ accessToken: "b1", refreshToken: "rb1" });
    response.resolve({ data: { accessToken: "stale", refreshToken: "stale" } });
    await refreshing;

    expect(TokenManager.getAccessToken()).toBe("b1");
  });

  it("keeps the session when refresh fails for connectivity reasons", async () => {
    post.mockRejectedValue(httpError());

    await expect(TokenManager.refreshToken()).rejects.toBeDefined();
    expect(TokenManager.getRefreshToken()).toBe("r1");
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it("keeps the session on a server error", async () => {
    post.mockRejectedValue(httpError(503));

    await expect(TokenManager.refreshToken()).rejects.toBeDefined();
    expect(TokenManager.getRefreshToken()).toBe("r1");
  });

  it("ends the session when the server rejects the refresh token", async () => {
    post.mockRejectedValue(httpError(401));

    await expect(TokenManager.refreshToken()).resolves.toBeUndefined();
    expect(TokenManager.getRefreshToken()).toBeUndefined();
    expect(storage.__store.has("authToken")).toBe(false);
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it("surfaces a failure to store credentials", async () => {
    storage.secureSave.mockRejectedValueOnce(new Error("keychain unavailable"));

    await expect(signIn()).rejects.toThrow("keychain unavailable");
  });

  it("notifies subscribers when tokens change", async () => {
    const listener = jest.fn();
    const unsubscribe = TokenManager.subscribe(listener);
    post.mockResolvedValue({ data: { accessToken: "a2", refreshToken: "r2" } });

    await TokenManager.refreshToken();
    unsubscribe();

    expect(listener).toHaveBeenCalledWith({ accessToken: "a2", refreshToken: "r2" });
  });
});
