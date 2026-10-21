/** Every query key in the app. Account isolation relies on `endSession` clearing all of them. */
export const queryKeys = {
  conversations: ["conversations"] as const,
  archivedConversations: ["archivedConversations"] as const,
  conversation: (conversationId?: string) => ["conversation", conversationId] as const,
  messages: (conversationId?: string) => ["conversationMessages", conversationId] as const,
  receipts: (conversationId?: string) => ["conversationReceipts", conversationId] as const,
  search: (query: string) => ["search", query] as const,
};

/** Query roots that are saved to disk so the app can show chats offline. */
export const PERSISTED_QUERY_ROOTS: readonly string[] = [
  queryKeys.conversations[0],
  queryKeys.archivedConversations[0],
  queryKeys.conversation()[0],
  queryKeys.messages()[0],
  queryKeys.receipts()[0],
];
