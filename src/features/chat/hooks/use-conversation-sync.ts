import { useRealtime } from "@components";
import { MessageModel } from "@shared/types/models";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useConversationMessages } from "../query";
import { applyMessages } from "../query/message-cache";

const NO_MESSAGES: MessageModel[] = [];

/**
 * Keeps one conversation's history current: the cached window, live socket messages
 * (including the user's own, so a send whose HTTP response was lost still reconciles),
 * and a catch-up fetch after every reconnect.
 */
export function useConversationSync(conversationId: string) {
  const queryClient = useQueryClient();
  const { socket, status, reconcileVersion } = useRealtime();
  const messagesQuery = useConversationMessages(conversationId);
  const { refetch } = messagesQuery;

  useEffect(() => {
    if (!socket || status !== "connected") return;

    const onMessage = (message: MessageModel) => {
      if (message.conversationId !== conversationId) return;
      applyMessages(queryClient, conversationId, [message]);
    };

    socket.on("message.created", onMessage);
    return () => {
      socket.off("message.created", onMessage);
    };
  }, [socket, status, conversationId, queryClient]);

  // `reconcileVersion` bumps on every (re)connect; fetch what was missed while away.
  const initialVersion = useRef(reconcileVersion);
  useEffect(() => {
    if (reconcileVersion !== initialVersion.current) void refetch();
  }, [reconcileVersion, refetch]);

  return {
    messages: messagesQuery.data?.items ?? NO_MESSAGES,
    isFetching: messagesQuery.isFetching,
    isLoading: messagesQuery.isPending,
    hasOlder: messagesQuery.hasOlder,
    isFetchingOlder: messagesQuery.isFetchingOlder,
    fetchOlder: messagesQuery.fetchOlder,
    reconcileVersion,
  };
}
