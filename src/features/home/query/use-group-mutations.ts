import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { CreateGroupConversationDto } from "@shared/types/api";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupConversationDto) =>
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

export function useUpdateGroupConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      data,
    }: {
      conversationId: string;
      data: { name?: string; avatarMediaId?: string | null };
    }) => ConversationService.updateGroupConversation(conversationId, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });
}

export function useSetGroupAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      mediaId,
    }: {
      conversationId: string;
      mediaId: string;
    }) => ConversationService.setGroupAvatar(conversationId, { mediaId }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void queryClient.invalidateQueries({
        queryKey: ["conversation", variables.conversationId],
      });
    },
  });
}
