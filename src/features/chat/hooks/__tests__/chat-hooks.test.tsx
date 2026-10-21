jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockSocket = { connected: true, emit: jest.fn(), on: jest.fn(), off: jest.fn() };
jest.mock("@components", () => ({
  useRealtime: () => ({ socket: mockSocket, status: "connected" }),
}));
jest.mock("@shared/context/auth-context", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));
const mockMarkAllAsRead = jest.fn();
jest.mock("../../query", () => ({
  useConversationReceipts: () => ({ data: undefined }),
  useMarkAllAsRead: () => ({ mutate: mockMarkAllAsRead }),
}));
jest.mock("expo-router", () => ({ useIsFocused: () => true }));
jest.mock("../../outbox/deliver", () => ({
  deliverOutboxEntry: jest.fn(),
  flushInterruptedSends: jest.fn(),
}));

import { act, renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { MessageModel } from "@shared/types/models";
import { useOutboxStore } from "../../store/outbox";
import { useMessageSender } from "../use-message-sender";
import { usePresenceAndTyping } from "../use-presence-and-typing";
import { useReadReceipts } from "../use-read-receipts";

const message = (id: string, senderId: string, clientMessageId = id): MessageModel => ({
  id,
  clientMessageId,
  conversationId: "c1",
  senderId,
  kind: "text",
  text: id,
  createdAt: "2026-01-01T00:00:00Z",
});

const emitted = (event: string) =>
  mockSocket.emit.mock.calls.filter(([name]) => name === event).length;

beforeEach(() => jest.clearAllMocks());

describe("usePresenceAndTyping", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("throttles typing.start and sends typing.stop after idle and on unmount", async () => {
    const { result, unmount } = await renderHook(() =>
      usePresenceAndTyping("c1", { selfId: "me" }),
    );

    await act(async () => {
      result.current.notifyTyping();
      result.current.notifyTyping();
      result.current.notifyTyping();
    });
    expect(emitted("typing.start")).toBe(1);

    await act(async () => jest.advanceTimersByTime(4_000));
    expect(emitted("typing.stop")).toBe(1);

    await act(async () => result.current.notifyTyping());
    expect(emitted("typing.start")).toBe(2);
    await unmount();
    expect(emitted("typing.stop")).toBe(2);
  });
});

describe("useReadReceipts", () => {
  it("marks messages that arrive while the chat is open as read", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    );
    const { rerender } = await renderHook(
      ({ messages }: { messages: MessageModel[] }) => useReadReceipts("c1", messages, "me"),
      { wrapper, initialProps: { messages: [message("m1", "them")] } },
    );
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);

    // My own message doesn't need a read update; a new incoming one does.
    await rerender({ messages: [message("m1", "them"), message("m2", "me")] });
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    await rerender({ messages: [message("m1", "them"), message("m2", "me"), message("m3", "them")] });
    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(2);
  });
});

describe("useMessageSender", () => {
  it("drops an outbox entry once its message is confirmed by any source", async () => {
    useOutboxStore.getState().clear();
    useOutboxStore.getState().put({
      clientMessageId: "client-1",
      conversationId: "c1",
      senderId: "me",
      kind: "text",
      text: "hi",
      attachments: [],
      createdAt: "2026-01-01T00:00:00Z",
      status: "failed",
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
    );
    const { result, rerender } = await renderHook(
      ({ confirmed }: { confirmed: MessageModel[] }) =>
        useMessageSender("c1", confirmed, { reconnectVersion: 0 }),
      { wrapper, initialProps: { confirmed: [] as MessageModel[] } },
    );
    expect(result.current.localMessages).toHaveLength(1);

    // E.g. the HTTP response was lost but the socket echo of our own message arrived.
    await rerender({ confirmed: [message("srv-1", "me", "client-1")] });
    expect(useOutboxStore.getState().entries).toEqual({});
    expect(result.current.localMessages).toHaveLength(0);
  });
});
