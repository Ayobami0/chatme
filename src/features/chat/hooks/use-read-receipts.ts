import { useRealtime } from "@components";
import { MessageModel } from "@shared/types/models";
import { ReceiptUpdatedEventPayload } from "@shared/types/realtime";
import { useIsFocused } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useConversationReceipts, useMarkAllAsRead } from "../query";

export type ParticipantReceipt = {
  userId: string;
  version?: number;
  delivered?: { messageId: string; at: string } | null;
  read?: { messageId: string; at: string } | null;
};

/**
 * Receipts for one conversation, in both directions:
 * - Other members' delivered/read positions (initial fetch + live socket updates).
 * - Marks incoming messages read while the chat is focused and the app is in the
 *   foreground, including messages that arrive after the chat was opened.
 */
export function useReadReceipts(
  conversationId: string,
  messages: MessageModel[],
  selfId?: string,
) {
  const { socket, status } = useRealtime();
  const { data } = useConversationReceipts(conversationId);
  const [receipts, setReceipts] = useState<ParticipantReceipt[]>([]);

  useEffect(() => {
    if (data?.items) setReceipts(data.items);
  }, [data]);

  useEffect(() => {
    if (!socket || status !== "connected") return;

    const onReceipt = (event: ReceiptUpdatedEventPayload) => {
      if (event.conversationId !== conversationId) return;
      setReceipts((prev) => {
        const next = prev.filter((r) => r.userId !== event.userId);
        return [
          ...next,
          { userId: event.userId, version: event.version, delivered: event.delivered, read: event.read },
        ];
      });
    };

    socket.on("receipt.delivered", onReceipt);
    socket.on("receipt.read", onReceipt);
    return () => {
      socket.off("receipt.delivered", onReceipt);
      socket.off("receipt.read", onReceipt);
    };
  }, [socket, status, conversationId]);

  // Outgoing read state.
  const isFocused = useIsFocused();
  // `currentState` can be unknown at launch, so only an explicit background state counts.
  const [isForeground, setIsForeground] = useState(AppState.currentState !== "background");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setIsForeground(state !== "background"),
    );
    return () => subscription.remove();
  }, []);

  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const newestIncomingId = [...messages].reverse().find((m) => m.senderId !== selfId)?.id;
  const lastMarkedId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isFocused || !isForeground || !newestIncomingId) return;
    if (lastMarkedId.current === newestIncomingId) return;
    lastMarkedId.current = newestIncomingId;
    markAllAsRead(conversationId);
  }, [isFocused, isForeground, newestIncomingId, conversationId, markAllAsRead]);

  return receipts;
}
