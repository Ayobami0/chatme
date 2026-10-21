import { ConversationModel, MessageModel } from "@shared/types/models";

export const isSameMessage = (a: MessageModel, b: MessageModel) =>
  a.id === b.id || (Boolean(a.clientMessageId) && a.clientMessageId === b.clientMessageId);

const byCreatedAt = (a: MessageModel, b: MessageModel) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt);

/**
 * The single merge policy for messages from any source (HTTP page, send response,
 * socket event). Matches on server id or clientMessageId, lets incoming data win,
 * and returns the list oldest-first.
 */
export function reconcileMessages(
  current: readonly MessageModel[],
  incoming: readonly MessageModel[],
): MessageModel[] {
  const result = [...current];

  for (const message of incoming) {
    const index = result.findIndex((existing) => isSameMessage(existing, message));
    if (index >= 0) {
      result[index] = { ...result[index], ...message };
    } else {
      result.push(message);
    }
  }

  return result.sort(byCreatedAt);
}

/** Updates the conversation-list preview if `message` is newer than the current latest message. */
export function withLatestMessage(
  conversations: ConversationModel[] | undefined,
  message: MessageModel,
): ConversationModel[] | undefined {
  if (!conversations) return conversations;

  return conversations.map((conversation) => {
    if (conversation.id !== message.conversationId) return conversation;

    const latestAt = conversation.latestMessage?.createdAt;
    if (latestAt && Date.parse(latestAt) > Date.parse(message.createdAt)) {
      return conversation;
    }

    return {
      ...conversation,
      latestMessage: {
        id: message.id,
        senderId: message.senderId,
        kind: message.kind,
        preview: message.text ?? (message.attachments?.length ? "Attachment" : ""),
        createdAt: message.createdAt,
      },
      lastActivityAt: message.createdAt,
    };
  });
}
