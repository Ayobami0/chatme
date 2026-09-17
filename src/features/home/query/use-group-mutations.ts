import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { name: string; participantIds: string[] }) =>
      ConversationService.createGroupConversation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useJoinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, participantIds }: { conversationId: string; participantIds: string[] }) =>
      ConversationService.addGroupMembers(conversationId, { participantIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCreateDirectConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ConversationService.createOrUpdateConversation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
