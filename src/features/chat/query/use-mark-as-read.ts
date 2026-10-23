import { queryKeys } from "@core/query/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      ConversationService.markAllConversationMessagesAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(conversationId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
      void queryClient.invalidateQueries({ queryKey: queryKeys.archivedConversations });
    },
  });
}
