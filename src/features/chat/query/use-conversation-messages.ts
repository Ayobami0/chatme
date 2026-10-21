import { queryKeys } from "@core/query/keys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { ConversationService } from "@services/conversation";
import {
  mergeLatestPage,
  mergeOlderPage,
  MessageWindow,
} from "../utils/reconcile-messages";

const PAGE_SIZE = 30;

/**
 * The conversation's cached message window. Refetches merge the newest page into the
 * cache (see `mergeLatestPage`); `fetchOlder` pages backwards with the stored cursor.
 */
export function useConversationMessages(conversationId?: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.messages(conversationId);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<MessageWindow> => {
      const page = await ConversationService.getConversationMessages(conversationId!, {
        limit: PAGE_SIZE,
      });
      return mergeLatestPage(queryClient.getQueryData<MessageWindow>(key), page);
    },
    enabled: Boolean(conversationId),
  });

  const olderCursor = query.data?.olderCursor ?? null;

  const fetchOlder = useCallback(async () => {
    if (!conversationId || !olderCursor || isFetchingOlder) return;
    setIsFetchingOlder(true);
    try {
      const page = await ConversationService.getConversationMessages(conversationId, {
        limit: PAGE_SIZE,
        cursor: olderCursor,
      });
      queryClient.setQueryData<MessageWindow>(queryKeys.messages(conversationId), (cached) =>
        mergeOlderPage(cached, page),
      );
    } finally {
      setIsFetchingOlder(false);
    }
  }, [conversationId, olderCursor, isFetchingOlder, queryClient]);

  return { ...query, fetchOlder, hasOlder: Boolean(olderCursor), isFetchingOlder };
}
