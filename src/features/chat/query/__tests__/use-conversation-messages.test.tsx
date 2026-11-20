jest.mock("@services/conversation", () => ({
  ConversationService: { getConversationMessages: jest.fn() },
}));

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ConversationService } from "@services/conversation";
import { MessageModel } from "@shared/types/models";
import { useConversationMessages } from "../use-conversation-messages";

const getMessages = ConversationService.getConversationMessages as jest.Mock;

const msg = (n: number): MessageModel => ({
  id: `m${n}`,
  clientMessageId: `c${n}`,
  conversationId: "conv",
  senderId: "u1",
  kind: "text",
  text: `${n}`,
  createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
  version: 0,
});

const page = (ids: number[], nextCursor: string | null) => ({
  items: ids.map(msg).reverse(),
  pageInfo: { nextCursor, hasNextPage: nextCursor !== null },
});

describe("useConversationMessages older pages", () => {
  it("surfaces a failed older page as state and recovers on retry", async () => {
    getMessages
      .mockResolvedValueOnce(page([5, 6], "before-5"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(page([3, 4], null));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(() => useConversationMessages("conv"), { wrapper });
    await waitFor(() => expect(result.current.hasOlder).toBe(true));

    // Resolves (never rejects) even though the request failed.
    await act(() => result.current.fetchOlder());
    expect(result.current.olderError?.message).toBe("offline");
    expect(result.current.data?.items.map((m) => m.id)).toEqual(["m5", "m6"]);

    await act(() => result.current.fetchOlder());
    expect(result.current.olderError).toBeNull();
    expect(result.current.data?.items.map((m) => m.id)).toEqual(["m3", "m4", "m5", "m6"]);
    expect(result.current.hasOlder).toBe(false);
  });
});
