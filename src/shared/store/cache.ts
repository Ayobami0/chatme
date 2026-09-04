import { CacheService } from "@services/cache";
import { ConversationModel, MessageModel } from "@shared/types/models";
import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useCacheStore = create(
  combine(
    {
      isHydrated: false,
      conversations: [] as ConversationModel[],
      messagesByConversation: {} as Record<string, MessageModel[]>,
    },
    (set, get) => ({
      hydrate: async () => {
        if (get().isHydrated) return;
        const conversations = await CacheService.getConversations();
        set({ conversations, isHydrated: true });
      },

      setConversations: (conversations: ConversationModel[]) => {
        set({ conversations });
        void CacheService.saveConversations(conversations);
      },

      loadMessagesForConversation: async (conversationId: string) => {
        const cachedMessages = await CacheService.getMessages(conversationId);
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: cachedMessages,
          },
        }));
        return cachedMessages;
      },

      setMessages: (conversationId: string, messages: MessageModel[]) => {
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages,
          },
        }));
        void CacheService.saveMessages(conversationId, messages);
      },

      addOrUpdateMessage: (conversationId: string, message: MessageModel) => {
        const currentMessages = get().messagesByConversation[conversationId] ?? [];
        const existingIndex = currentMessages.findIndex(
          (m) =>
            m.id === message.id ||
            (m.clientMessageId && m.clientMessageId === message.clientMessageId),
        );

        let updatedMessages: MessageModel[];
        if (existingIndex >= 0) {
          updatedMessages = [...currentMessages];
          updatedMessages[existingIndex] = message;
        } else {
          updatedMessages = [...currentMessages, message];
        }

        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: updatedMessages,
          },
        }));
        void CacheService.saveMessages(conversationId, updatedMessages);

        // Also update conversation latest message preview in store
        const currentConversations = get().conversations;
        const convIndex = currentConversations.findIndex(
          (c) => c.id === conversationId,
        );
        if (convIndex >= 0) {
          const targetConv = currentConversations[convIndex];
          const updatedConv: ConversationModel = {
            ...targetConv,
            latestMessage: {
              id: message.id,
              preview: message.text,
              createdAt: message.createdAt,
              kind: message.kind,
              senderId: message.senderId,
            },
            lastActivityAt: message.createdAt,
          };
          const updatedConvs = [...currentConversations];
          updatedConvs[convIndex] = updatedConv;
          set({ conversations: updatedConvs });
          void CacheService.saveConversations(updatedConvs);
        }
      },

      addOrUpdateConversation: (conversation: ConversationModel) => {
        const currentConversations = get().conversations;
        const convIndex = currentConversations.findIndex(
          (c) => c.id === conversation.id,
        );

        let updatedConvs: ConversationModel[];
        if (convIndex >= 0) {
          updatedConvs = [...currentConversations];
          updatedConvs[convIndex] = {
            ...updatedConvs[convIndex],
            ...conversation,
          };
        } else {
          updatedConvs = [conversation, ...currentConversations];
        }

        set({ conversations: updatedConvs });
        void CacheService.saveConversations(updatedConvs);
      },

      clearCache: async () => {
        set({
          isHydrated: false,
          conversations: [],
          messagesByConversation: {},
        });
        await CacheService.clearAllCache();
      },
    }),
  ),
);
