import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MessageModel } from "@shared/types/models";

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["conversationMessages", conversationId],
    queryFn: async (): Promise<MessageModel[]> => {
      if (!conversationId) return [];
      const res = await ConversationService.getConversationMessages(conversationId);
      return [...(res.items ?? [])].reverse();
    },
    enabled: Boolean(conversationId),
  });
}
