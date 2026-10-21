import { queryKeys } from "@core/query/keys";
import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useConversationReceipts(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.receipts(conversationId),
    queryFn: () =>
      conversationId
        ? ConversationService.reconcileParticipantReadReceipts(conversationId)
        : null,
    enabled: Boolean(conversationId),
  });
}
