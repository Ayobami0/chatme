import { queryKeys } from "@core/query/keys";
import { ConversationModel, MessageModel } from "@shared/types/models";
import { QueryClient } from "@tanstack/react-query";
import { reconcileMessages, withLatestMessage } from "../utils/reconcile-messages";

/** Merges authoritative messages into the query cache and refreshes the conversation previews. */
export function applyMessages(
  queryClient: QueryClient,
  conversationId: string,
  messages: MessageModel[],
) {
  if (messages.length === 0) return;

  queryClient.setQueryData<MessageModel[]>(queryKeys.messages(conversationId), (current) =>
    reconcileMessages(current ?? [], messages),
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
