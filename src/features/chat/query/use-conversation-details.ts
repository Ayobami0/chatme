import { queryKeys } from "@core/query/keys";
import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useConversationDetails(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () =>
      conversationId
        ? ConversationService.getConversationById(conversationId)
        : null,
    enabled: Boolean(conversationId),
  });
}
