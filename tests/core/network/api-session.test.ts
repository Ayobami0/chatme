jest.mock("@services/storage", () => ({
  __esModule: true,
  default: { secureSave: jest.fn(), secureGet: jest.fn(), secureRemove: jest.fn() },
  StorageKey: { AuthToken: "authToken" },
}));

import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@core/network/api";
import { StaleSessionError } from "@core/network/errors";
import { TokenManager } from "@services/token-manager";

type Call = {
  config: InternalAxiosRequestConfig;
  respond: (status: number, data?: unknown) => void;
};

/** A transport whose responses the test releases one by one. */
const calls: Call[] = [];
apiClient.defaults.adapter = (config) =>
  new Promise((resolve, reject) => {
    calls.push({
      config,
      respond: (status, data = {}) => {
        const response = { status, statusText: "", data, headers: {}, config };
        if (status < 400) resolve(response);
        else reject(new AxiosError("failed", "ERR_BAD_REQUEST", config, undefined, response as never));
      },
    });
  });

const refresh = jest.spyOn(axios, "post");
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const authHeader = (call: Call) => AxiosHeaders.from(call.config.headers).get("Authorization");

const signInAs = (name: string) =>
  TokenManager.setTokens({ accessToken: `${name}-access`, refreshToken: `${name}-refresh` });

describe("HTTP session ownership", () => {
  beforeEach(async () => {
    calls.length = 0;
    jest.clearAllMocks();
    TokenManager.setOnUnauthenticatedListener(null);
    await signInAs("A");
  });

  it("does not refresh or replay A's request with B's token after B signs in", async () => {
    const request = apiClient.get("/me");
    await flush();

    await signInAs("B");
    calls[0].respond(401);

    await expect(request).rejects.toBeInstanceOf(StaleSessionError);
    expect(refresh).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
    expect(TokenManager.getAccessToken()).toBe("B-access");
  });

  it("does not let a late 401 on A's retried request clear B's session", async () => {
    refresh.mockResolvedValueOnce({ data: { accessToken: "A2-access", refreshToken: "A2-refresh" } });
    const request = apiClient.get("/me");
    await flush();
    calls[0].respond(401);
    await flush();
    await flush();
    expect(calls).toHaveLength(2); // retried once with A's refreshed token
    expect(authHeader(calls[1])).toBe("Bearer A2-access");

    await signInAs("B");
    calls[1].respond(401);

    await expect(request).rejects.toBeInstanceOf(StaleSessionError);
    expect(TokenManager.getAccessToken()).toBe("B-access");
  });

  it("does not replay A's request when B signs in while A's refresh is running", async () => {
    let finishRefresh!: (value: unknown) => void;
    refresh.mockReturnValueOnce(new Promise((resolve) => (finishRefresh = resolve)) as never);
    const request = apiClient.get("/me");
    await flush();
    calls[0].respond(401);
    await flush();

    await signInAs("B");
    finishRefresh({ data: { accessToken: "A2-access", refreshToken: "A2-refresh" } });

    await expect(request).rejects.toBeInstanceOf(StaleSessionError);
    expect(calls).toHaveLength(1);
    expect(TokenManager.getAccessToken()).toBe("B-access");
  });

  it("drops a successful response that arrives after the session changed", async () => {
    const request = apiClient.get("/conversations");
    await flush();

    await signInAs("A"); // logging out and back into the same account is a new session
    calls[0].respond(200, { items: ["A's old data"] });

    await expect(request).rejects.toBeInstanceOf(StaleSessionError);
  });

  it("refuses to send a request pinned to an ended session", async () => {
    const session = TokenManager.captureSession();
    await signInAs("B");

    await expect(
      apiClient.post("/conversations/c1/messages", {}, { sessionGeneration: session.generation }),
    ).rejects.toBeInstanceOf(StaleSessionError);
    expect(calls).toHaveLength(0);
  });

  it("still refreshes and retries within the same session", async () => {
    refresh.mockResolvedValueOnce({ data: { accessToken: "A2-access", refreshToken: "A2-refresh" } });
    const request = apiClient.get("/me");
    await flush();
    calls[0].respond(401);
    await flush();
    await flush();
    calls[1].respond(200, { id: "a" });

    await expect(request).resolves.toMatchObject({ data: { id: "a" } });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("sends cleanup for an ended session with its own token, never refreshing", async () => {
    await signInAs("B");
    const request = apiClient.delete("/me/push-devices/x", { authOverride: "A-access" });
    await flush();
    expect(authHeader(calls[0])).toBe("Bearer A-access");

    calls[0].respond(401);
    await expect(request).rejects.toBeInstanceOf(AxiosError);
    expect(refresh).not.toHaveBeenCalled();
    expect(TokenManager.getAccessToken()).toBe("B-access");
  });
});
