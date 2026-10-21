import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useConversationDetails(conversationId?: string) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () =>
      conversationId
        ? ConversationService.getConversationById(conversationId)
        : null,
    enabled: Boolean(conversationId),
  });
}
