import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useConversationReceipts(conversationId?: string) {
  return useQuery({
    queryKey: ["conversationReceipts", conversationId],
    queryFn: () =>
      conversationId
        ? ConversationService.reconcileParticipantReadReceipts(conversationId)
        : null,
    enabled: Boolean(conversationId),
  });
}
