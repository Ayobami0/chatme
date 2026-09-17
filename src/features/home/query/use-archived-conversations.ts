import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MuteConversationDto } from "@shared/types/api";

export function useArchivedConversations() {
  const queryClient = useQueryClient();

  const archivedQuery = useQuery({
    queryKey: ["archivedConversations"],
    queryFn: async () => {
      const response = await ConversationService.getArchivedConversations();
      return response.items;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["archivedConversations"] });
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => ConversationService.unarchiveConversation(id),
    onSuccess: invalidate,
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => ConversationService.pinConversation(id),
    onSuccess: invalidate,
  });

  const unpinMutation = useMutation({
    mutationFn: (id: string) => ConversationService.unpinConversation(id),
    onSuccess: invalidate,
  });

  const muteMutation = useMutation({
    mutationFn: (args: string | { id: string; data?: MuteConversationDto }) => {
      const id = typeof args === "string" ? args : args.id;
      const data = typeof args === "string" ? { duration: "always" as const } : (args.data ?? { duration: "always" as const });
      return ConversationService.muteConversation(id, data);
    },
    onSuccess: invalidate,
  });

  const unmuteMutation = useMutation({
    mutationFn: (id: string) => ConversationService.unmuteConversation(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ConversationService.deleteGroupConversation(id),
    onSuccess: invalidate,
  });

  return {
    archivedQuery,
    archivedConversations: archivedQuery.data ?? [],
    unarchiveMutation,
    pinMutation,
    unpinMutation,
    muteMutation,
    unmuteMutation,
    deleteMutation,
  };
}
