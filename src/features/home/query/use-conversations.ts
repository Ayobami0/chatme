import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MuteConversationDto } from "@shared/types/api";

export function useConversations() {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await ConversationService.getConversations();
      return response.items;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const pinMutation = useMutation({
    mutationFn: (id: string) => ConversationService.pinConversation(id),
    onSuccess: invalidate,
  });

  const unpinMutation = useMutation({
    mutationFn: (id: string) => ConversationService.unpinConversation(id),
    onSuccess: invalidate,
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => ConversationService.archiveConversation(id),
    onSuccess: invalidate,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => ConversationService.unarchiveConversation(id),
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
    conversationsQuery,
    conversations: conversationsQuery.data ?? [],
    pinMutation,
    unpinMutation,
    archiveMutation,
    unarchiveMutation,
    muteMutation,
    unmuteMutation,
    deleteMutation,
  };
}
