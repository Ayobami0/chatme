import { client } from "@core/query";
import { queryKeys } from "@core/query/keys";
import { ConversationModel } from "@shared/types/models";
import { router } from "expo-router";

/** Conversation ids are UUIDs (per the API spec); reject anything else. */
const CONVERSATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseConversationId(value: unknown): string | undefined {
  const id = Array.isArray(value) ? value[0] : value;
  return typeof id === "string" && CONVERSATION_ID.test(id) ? id : undefined;
}

/**
 * Opens a conversation's chat screen. The route carries only the id (the same shape
 * a deep link or notification uses); the screen loads the authoritative details.
 * The model we already have is seeded into the cache so the header renders at once.
 */
export function openConversation(conversation: ConversationModel) {
  const key = queryKeys.conversation(conversation.id);
  if (!client.getQueryData(key)) client.setQueryData(key, conversation);

  router.push({
    pathname: "/chat/[conversationId]",
    params: { conversationId: conversation.id },
  });
}
