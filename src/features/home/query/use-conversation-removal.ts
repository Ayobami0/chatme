import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { useCacheStore } from "@shared/store/cache";
import { ConversationModel } from "@shared/types/models";
import { getRemovalAction } from "../utils/conversation-removal";

const removeConversation = (conversation: ConversationModel) => {
  switch (getRemovalAction(conversation)) {
    case "remove-for-me":
      return ConversationService.removeDirectConversationForMe(conversation.id);
    case "delete-group":
      return ConversationService.deleteGroup(conversation.id);
    case "leave-group":
      return ConversationService.leaveGroup(conversation.id);
  }
};

/**
 * Removes a conversation using the action that matches its type and the user's role
 * (see `getRemovalAction`), then drops it from every local cache.
 */
export function useConversationRemoval() {
  const queryClient = useQueryClient();
  const removeCachedConversation = useCacheStore((s) => s.removeConversation);

  return useMutation({
    mutationFn: removeConversation,
    onSuccess: (_, conversation) => {
      const without = (list?: ConversationModel[]) =>
        list?.filter((c) => c.id !== conversation.id);

      queryClient.setQueryData(["conversations"], without);
      queryClient.setQueryData(["archivedConversations"], without);
      queryClient.removeQueries({ queryKey: ["conversation", conversation.id] });
      queryClient.removeQueries({ queryKey: ["conversationMessages", conversation.id] });
      removeCachedConversation(conversation.id);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({ queryKey: ["archivedConversations"] });
    },
  });
}
