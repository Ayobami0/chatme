jest.mock("expo-crypto", () => ({ randomUUID: () => require("crypto").randomUUID() }));
jest.mock("expo-device", () => ({ isDevice: true }));
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: "proj-1" } } } },
}));
jest.mock("expo-notifications", () => ({
  DEFAULT_ACTION_IDENTIFIER: "default",
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(async () => undefined),
}));
jest.mock("@services/push", () => ({
  PushService: { registerDevice: jest.fn(), unregisterDevice: jest.fn() },
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@core/query", () => ({ client: {} }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { act, renderHook } from "@testing-library/react-native";
import { PushService } from "@services/push";
import { getInstallationId } from "../installation-id";
import { registerForPushNotifications } from "../push-registration";
import { conversationIdFromResponse } from "../notification-routing";
import { useNotificationRouting } from "../hooks";

const N = Notifications as unknown as Record<string, jest.Mock>;
const CONVERSATION = "0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e";
const tap = (data: Record<string, unknown>, actionIdentifier = "default") => ({
  actionIdentifier,
  notification: { request: { content: { data } } },
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

describe("installation id", () => {
  it("is a UUID that stays the same across calls", async () => {
    const first = await getInstallationId();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getInstallationId()).toBe(first);
    expect(await AsyncStorage.getItem("push_installation_id")).toBe(JSON.stringify(first));
  });
});

describe("registerForPushNotifications", () => {
  it("registers the Expo token for this installation", async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: true });
    N.getExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[abc]" });

    await expect(registerForPushNotifications()).resolves.toBe("registered");

    expect(N.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "proj-1" });
    expect(PushService.registerDevice).toHaveBeenCalledWith(await getInstallationId(), {
      platform: "ios",
      token: "ExponentPushToken[abc]",
    });
  });

  it("does not register when permission is denied", async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    N.requestPermissionsAsync.mockResolvedValue({ granted: false });

    await expect(registerForPushNotifications()).resolves.toBe("denied");
    expect(PushService.registerDevice).not.toHaveBeenCalled();
  });

  it("does not re-prompt once the user has permanently declined", async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    await expect(registerForPushNotifications()).resolves.toBe("denied");
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe("conversationIdFromResponse", () => {
  it("routes a tap with a valid conversation id", () => {
    expect(conversationIdFromResponse(tap({ conversationId: CONVERSATION }) as never)).toBe(
      CONVERSATION,
    );
  });

  it.each([{}, { conversationId: "../settings" }, { conversationId: 42 }])(
    "ignores an untrusted payload %p",
    (data) => {
      expect(conversationIdFromResponse(tap(data) as never)).toBeUndefined();
    },
  );

  it("ignores non-tap actions", () => {
    expect(
      conversationIdFromResponse(tap({ conversationId: CONVERSATION }, "reply") as never),
    ).toBeUndefined();
  });
});

describe("useNotificationRouting", () => {
  it("holds a cold-start tap until the session is ready, then opens the chat once", async () => {
    N.getLastNotificationResponseAsync.mockResolvedValue(tap({ conversationId: CONVERSATION }));
    N.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });

    const { rerender } = renderHook(({ ready }: { ready: boolean }) => useNotificationRouting(ready), {
      initialProps: { ready: false },
    });
    await act(async () => undefined);
    expect(router.push).not.toHaveBeenCalled();

    await act(async () => rerender({ ready: true }));
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/chat/[conversationId]",
      params: { conversationId: CONVERSATION },
    });
    expect(N.clearLastNotificationResponseAsync).toHaveBeenCalled();

    await act(async () => rerender({ ready: true }));
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("opens the chat for a tap while the app is running", async () => {
    N.getLastNotificationResponseAsync.mockResolvedValue(null);
    let onTap!: (response: unknown) => void;
    N.addNotificationResponseReceivedListener.mockImplementation((listener) => {
      onTap = listener;
      return { remove: jest.fn() };
    });

    renderHook(() => useNotificationRouting(true));
    await act(async () => onTap(tap({ conversationId: CONVERSATION })));

    expect(router.push).toHaveBeenCalledTimes(1);
  });
});
