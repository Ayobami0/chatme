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

/** The cached slice of a conversation's history: oldest-first messages plus how to load older ones. */
export type MessageWindow = {
  items: MessageModel[];
  /** Cursor for the page before `items[0]`; null when there is nothing older. */
  olderCursor: string | null;
};

type MessagePage = {
  items: MessageModel[];
  pageInfo: { nextCursor: string | null; hasNextPage: boolean };
};

const pageCursor = (page: MessagePage) =>
  page.pageInfo.hasNextPage ? page.pageInfo.nextCursor : null;

/**
 * Merges the newest page into the cached window. If the page doesn't overlap the
 * cache and more pages exist, messages were missed (e.g. while offline), so the
 * stale history is dropped rather than leaving a silent gap.
 */
export function mergeLatestPage(cached: MessageWindow | undefined, page: MessagePage): MessageWindow {
  const overlaps =
    cached?.items.some((c) => page.items.some((p) => isSameMessage(c, p))) ?? false;

  if (!cached || (!overlaps && page.pageInfo.hasNextPage)) {
    return { items: reconcileMessages([], page.items), olderCursor: pageCursor(page) };
  }

  return { items: reconcileMessages(cached.items, page.items), olderCursor: cached.olderCursor };
}

/** Merges an older page fetched with `olderCursor`. */
export function mergeOlderPage(cached: MessageWindow | undefined, page: MessagePage): MessageWindow {
  return {
    items: reconcileMessages(cached?.items ?? [], page.items),
    olderCursor: pageCursor(page),
  };
}
