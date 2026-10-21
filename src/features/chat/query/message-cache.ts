import { queryKeys } from "@core/query/keys";
import { ConversationModel, MessageModel } from "@shared/types/models";
import { QueryClient } from "@tanstack/react-query";
import {
  MessageWindow,
  reconcileMessages,
  withLatestMessage,
} from "../utils/reconcile-messages";

/**
 * Merges authoritative messages (send responses, socket events) into a loaded
 * conversation and refreshes the conversation previews. A conversation that hasn't
 * been loaded yet is left alone; opening it fetches the latest page.
 */
export function applyMessages(
  queryClient: QueryClient,
  conversationId: string,
  messages: MessageModel[],
) {
  if (messages.length === 0) return;

  queryClient.setQueryData<MessageWindow>(queryKeys.messages(conversationId), (current) =>
    current ? { ...current, items: reconcileMessages(current.items, messages) } : current,
  );

  const newest = messages.reduce((a, b) =>
    Date.parse(a.createdAt) >= Date.parse(b.createdAt) ? a : b,
  );
  for (const key of [queryKeys.conversations, queryKeys.archivedConversations]) {
    queryClient.setQueryData<ConversationModel[]>(key, (current) =>
      withLatestMessage(current, newest),
    );
  }
}
