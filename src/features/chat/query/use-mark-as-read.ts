import { queryKeys } from "@core/query/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { ConversationModel } from "@shared/types/models";

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      ConversationService.markAllConversationMessagesAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Read state lives in receipts, so the message history doesn't need refetching.
      for (const key of [queryKeys.conversations, queryKeys.archivedConversations]) {
        queryClient.setQueryData<ConversationModel[]>(key, (current) =>
          current?.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
        );
      }
    },
  });
}
