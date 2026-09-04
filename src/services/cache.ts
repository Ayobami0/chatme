import AsyncStorage from "@react-native-async-storage/async-storage";
import StorageService from "./storage";
import { ConversationModel, MessageModel } from "@shared/types/models";

export const CACHE_KEYS = {
  CONVERSATIONS: "cache_conversations",
  MESSAGES_PREFIX: "cache_messages_",
};

export class CacheService {
  static async getConversations(): Promise<ConversationModel[]> {
    const data = await StorageService.get<ConversationModel[]>(
      CACHE_KEYS.CONVERSATIONS,
    );
    return data ?? [];
  }

  static async saveConversations(
    conversations: ConversationModel[],
  ): Promise<void> {
    await StorageService.save(CACHE_KEYS.CONVERSATIONS, conversations);
  }

  static async getMessages(conversationId: string): Promise<MessageModel[]> {
    const data = await StorageService.get<MessageModel[]>(
      `${CACHE_KEYS.MESSAGES_PREFIX}${conversationId}`,
    );
    return data ?? [];
  }

  static async saveMessages(
    conversationId: string,
    messages: MessageModel[],
  ): Promise<void> {
    await StorageService.save(
      `${CACHE_KEYS.MESSAGES_PREFIX}${conversationId}`,
      messages,
    );
  }

  static async clearAllCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(
        (key) =>
          key === CACHE_KEYS.CONVERSATIONS ||
          key.startsWith(CACHE_KEYS.MESSAGES_PREFIX),
      );
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {
      await StorageService.remove(CACHE_KEYS.CONVERSATIONS);
    }
  }
}
