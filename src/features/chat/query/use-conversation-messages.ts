import { queryKeys } from "@core/query/keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MessageModel } from "@shared/types/models";
import { reconcileMessages } from "../utils/reconcile-messages";

export function useConversationMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: async (): Promise<MessageModel[]> => {
      if (!conversationId) return [];
      const res = await ConversationService.getConversationMessages(conversationId);
      // Merge rather than replace, so messages received over the socket (or older
      // cached ones outside this page) survive a refetch.
      const cached =
        queryClient.getQueryData<MessageModel[]>(queryKeys.messages(conversationId)) ?? [];
      return reconcileMessages(cached, res.items ?? []);
    },
    enabled: Boolean(conversationId),
  });
}
