import { apiClient } from "@core/network/api";
import {
  ConversationMessagePostRequest,
  ConversationMessageReadResponse,
  PaginatedResponse,
} from "@shared/types/api";
import { ConversationModel, MessageModel } from "@shared/types/models";

export class ConversationService {
  static async createOrUpdateConversation(
    paticipantID: string,
  ): Promise<ConversationModel> {
    const response = await apiClient.post<ConversationModel>(`/conversations/direct`, {
      participantId: paticipantID,
    });
    return response.data;
  }

  static async getConversations(): Promise<
    PaginatedResponse<ConversationModel>
  > {
    const response =
      await apiClient.get<PaginatedResponse<ConversationModel>>(
        `/conversations`,
      );
    return response.data;
  }

  static async getConversationById(
    conversationID: string,
  ): Promise<ConversationModel> {
    const response = await apiClient.get<ConversationModel>(
      `/conversations/${conversationID}`,
    );

    return response.data;
  }

  static async sendMessage(
    conversationID: string,
    data: ConversationMessagePostRequest
  ): Promise<MessageModel> {
    const response = await apiClient.post<MessageModel>(
      `/conversations/${conversationID}/messages`,
      data
    );
    return response.data;
  }

  static async getConversationMessages(
    conversationID: string,
  ): Promise<PaginatedResponse<MessageModel>> {
    const response = await apiClient.get<PaginatedResponse<MessageModel>>(
      `/conversations/${conversationID}/messages`,
    );
    return response.data;
  }

  static async markAllConversationMessagesAsRead(
    conversationID: string,
  ): Promise<ConversationMessageReadResponse> {
    const response = await apiClient.post<ConversationMessageReadResponse>(
      `/conversations/${conversationID}/read`,
    );

    return response.data;
  }

  static async markIncomingMessageAsDelivered(
    conversationID: string,
    throughMessageId: string,
  ) {
    const response = await apiClient.put(
      `/conversations/${conversationID}/receipts/delivered`,
      {
        throughMessageId,
      }
    );
    return response.data;
  }

  static async markIncomingMessageAsRead(
    conversationID: string,
    throughMessageId: string,
  ) {
    const response = await apiClient.put(
      `/conversations/${conversationID}/receipts/read`,
      {
        throughMessageId,
      }
    );
    return response.data;
  }
}
