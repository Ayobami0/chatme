import { act, render } from "@testing-library/react-native";
import { TokenManager } from "@services/token-manager";
import { AppRealtimeProvider } from "../app-realtime-provider";

const mockSockets: MockSocket[] = [];

class MockSocket {
  handlers = new Map<string, (...args: unknown[]) => void>();
  connect = jest.fn();
  disconnect = jest.fn();
  io = { on: jest.fn(), removeAllListeners: jest.fn() };
  constructor(public options: { auth: (cb: (data: unknown) => void) => void }) {}
  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers.set(event, handler);
    return this;
  }
  onAny() {}
  removeAllListeners() {}
  emit(event: string, ...args: unknown[]) {
    this.handlers.get(event)?.(...args);
  }
  handshakeToken() {
    let token: unknown;
    this.options.auth((data) => (token = (data as { token: string }).token));
    return token;
  }
}

jest.mock("socket.io-client", () => ({
  io: jest.fn((_url: string, options: never) => {
    const socket = new MockSocket(options);
    mockSockets.push(socket);
    return socket;
  }),
}));
jest.mock("@shared/context/auth-context", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));
jest.mock("@services/token-manager", () => {
  let token = "a1";
  return {
    TokenManager: {
      getAccessToken: () => token,
      subscribe: () => () => undefined,
      refreshToken: jest.fn(async () => {
        token = "a2";
        return { accessToken: "a2", refreshToken: "r2" };
      }),
    },
  };
});
jest.mock("@services/conversation", () => ({ ConversationService: {} }));

describe("AppRealtimeProvider", () => {
  it("refreshes the token and reconnects after the server rejects the socket", async () => {
    await render(<AppRealtimeProvider enabled>{null}</AppRealtimeProvider>);
    const socket = mockSockets[0];
    expect(socket.handshakeToken()).toBe("a1");

    await act(async () => {
      socket.emit("disconnect", "io server disconnect");
    });

    expect(TokenManager.refreshToken).toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalled();
    // The reconnection handshake reads the refreshed token, not the one from mount.
    expect(socket.handshakeToken()).toBe("a2");
    expect(mockSockets).toHaveLength(1);
  });

  it("reconnects after an expired-token handshake error", async () => {
    mockSockets.length = 0;
    await render(<AppRealtimeProvider enabled>{null}</AppRealtimeProvider>);
    const socket = mockSockets[0];

    await act(async () => {
      socket.emit(
        "connect_error",
        Object.assign(new Error("expired"), { data: { code: "AUTH_ACCESS_TOKEN_INVALID" } }),
      );
    });

    expect(socket.connect).toHaveBeenCalled();
  });
});
