import { ConversationModel } from "@shared/types/models";
import { router } from "expo-router";

/** Opens a conversation's chat screen. The single place that builds chat route params. */
export function openConversation(conversation: ConversationModel) {
  const isDirect = conversation.type === "direct";

  router.push({
    pathname: "/chat/[conversationId]",
    params: {
      conversationId: conversation.id,
      isGroup: String(!isDirect),
      activeAt: conversation.lastActivityAt ?? "",
      participantId: isDirect ? conversation.otherParticipant.id : "",
      displayName: encodeURIComponent(
        (isDirect ? conversation.otherParticipant.displayName : conversation.name) ?? "",
      ),
      profileUrl: encodeURIComponent(
        (isDirect ? conversation.otherParticipant.avatarUrl : conversation.avatarUrl) ?? "",
      ),
    },
  });
}
