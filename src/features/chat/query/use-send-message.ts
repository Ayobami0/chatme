import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useSendMessage(conversationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, id }: { text: string; id: string }) => {
      if (!conversationId) throw new Error("Conversation ID required");
      return await ConversationService.sendMessage(conversationId, {
        text,
        clientMessageId: id,
      });
    },
    onSuccess: () => {
      if (conversationId) {
        void queryClient.invalidateQueries({
          queryKey: ["conversationMessages", conversationId],
        });
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });
}
