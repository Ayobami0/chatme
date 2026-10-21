import { queryKeys } from "@core/query/keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { applyMessages } from "./message-cache";

export function useSendMessage(conversationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      text,
      id,
      attachmentMediaIds,
    }: {
      text: string;
      id: string;
      attachmentMediaIds?: string[];
    }) => {
      if (!conversationId) throw new Error("Conversation ID required");
      return await ConversationService.sendMessage(conversationId, {
        text,
        clientMessageId: id,
        attachmentMediaIds
      });
    },
    onSuccess: (message) => {
      if (!conversationId) return;
      applyMessages(queryClient, conversationId, [message]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}
