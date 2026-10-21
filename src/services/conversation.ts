import { apiClient } from "@core/network/api";
import {
  AddGroupMembersDto,
  ClearConversationMessagesResponseDto,
  ConversationMessagePostRequest,
  ConversationMessageReadResponse,
  ConversationReceiptsGetResponse,
  ConversationSettingsResponseDto,
  CreateGroupConversationDto,
  EditMessageDto,
  MessageHistoryResponseDto,
  MuteConversationDto,
  PaginatedResponse,
  ReactionEmoji,
  ReceiptUpdateResponseDto,
  SetGroupAvatarDto,
  UpdateConversationSettingsDto,
  UpdateGroupConversationDto,
  UpdateGroupMemberRoleDto,
} from "@shared/types/api";
import { ConversationModel, GroupConversationModel, MessageModel } from "@shared/types/models";

export class ConversationService {
  // Direct conversations
  static async createDirectConversation(
    participantId: string,
  ): Promise<ConversationModel> {
    const response = await apiClient.post<ConversationModel>(
      `/conversations/direct`,
      { participantId },
    );
    return response.data;
  }

  // Alias for backward compatibility
  static async createOrUpdateConversation(
    participantID: string,
  ): Promise<ConversationModel> {
    return ConversationService.createDirectConversation(participantID);
  }

  // Group conversations
  static async createGroupConversation(
    data: CreateGroupConversationDto,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.post<GroupConversationModel>(
      `/conversations/group`,
      data,
    );
    return response.data;
  }

  static async updateGroupConversation(
    conversationId: string,
    data: UpdateGroupConversationDto,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.patch<GroupConversationModel>(
      `/conversations/${conversationId}`,
      data,
    );
    return response.data;
  }

  static async deleteGroupConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`);
  }

  static async getConversationById(
    conversationID: string,
  ): Promise<ConversationModel> {
    const response = await apiClient.get<ConversationModel>(
      `/conversations/${conversationID}`,
    );
    return response.data;
  }

  static async setGroupAvatar(
    conversationId: string,
    data: SetGroupAvatarDto,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.put<GroupConversationModel>(
      `/conversations/${conversationId}/avatar`,
      data,
    );
    return response.data;
  }

  static async clearGroupAvatar(
    conversationId: string,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.delete<GroupConversationModel>(
      `/conversations/${conversationId}/avatar`,
    );
    return response.data;
  }

  static async addGroupMembers(
    conversationId: string,
    data: AddGroupMembersDto,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.post<GroupConversationModel>(
      `/conversations/${conversationId}/members`,
      data,
    );
    return response.data;
  }

  static async removeGroupMember(
    conversationId: string,
    memberId: string,
  ): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}/members/${memberId}`);
  }

  static async updateGroupMemberRole(
    conversationId: string,
    memberId: string,
    data: UpdateGroupMemberRoleDto,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.patch<GroupConversationModel>(
      `/conversations/${conversationId}/members/${memberId}/role`,
      data,
    );
    return response.data;
  }

  static async transferGroupOwnership(
    conversationId: string,
    newOwnerId: string,
  ): Promise<GroupConversationModel> {
    const response = await apiClient.post<GroupConversationModel>(
      `/conversations/${conversationId}/transfer-ownership`,
      { newOwnerId },
    );
    return response.data;
  }

  static async leaveGroup(conversationId: string): Promise<void> {
    await apiClient.post(`/conversations/${conversationId}/leave`);
  }

  // Conversation Lists
  static async getConversations(params?: {
    limit?: number;
    archived?: boolean;
    cursor?: string;
  }): Promise<PaginatedResponse<ConversationModel>> {
    const response = await apiClient.get<PaginatedResponse<ConversationModel>>(
      `/conversations`,
      { params },
    );
    return response.data;
  }

  static async getArchivedConversations(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<PaginatedResponse<ConversationModel>> {
    const response = await apiClient.get<PaginatedResponse<ConversationModel>>(
      `/conversations/archived`,
      { params },
    );
    return response.data;
  }

  static async getFavoriteConversations(params?: {
    limit?: number;
    archived?: boolean;
    cursor?: string;
  }): Promise<PaginatedResponse<ConversationModel>> {
    const response = await apiClient.get<PaginatedResponse<ConversationModel>>(
      `/conversations/favorites`,
      { params },
    );
    return response.data;
  }

  // Conversation Settings
  static async updateConversationSettings(
    conversationId: string,
    data: UpdateConversationSettingsDto,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.patch<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/settings`,
      data,
    );
    return response.data;
  }

  static async archiveConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.put<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/archive`,
    );
    return response.data;
  }

  static async unarchiveConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/archive`,
    );
    return response.data;
  }

  static async muteConversation(
    conversationId: string,
    data: MuteConversationDto,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.put<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/mute`,
      data,
    );
    return response.data;
  }

  static async unmuteConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/mute`,
    );
    return response.data;
  }

  static async favoriteConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.put<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/favorite`,
    );
    return response.data;
  }

  static async unfavoriteConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/favorite`,
    );
    return response.data;
  }

  static async pinConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.put<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/pin`,
    );
    return response.data;
  }

  static async unpinConversation(
    conversationId: string,
  ): Promise<ConversationSettingsResponseDto> {
    const response = await apiClient.delete<ConversationSettingsResponseDto>(
      `/conversations/${conversationId}/pin`,
    );
    return response.data;
  }

  // Messages
  static async sendMessage(
    conversationID: string,
    data: ConversationMessagePostRequest,
  ): Promise<MessageModel> {
    const response = await apiClient.post<MessageModel>(
      `/conversations/${conversationID}/messages`,
      data,
    );
    return response.data;
  }

  static async getConversationMessages(
    conversationID: string,
    params?: { limit?: number; cursor?: string },
  ): Promise<MessageHistoryResponseDto> {
    const response = await apiClient.get<MessageHistoryResponseDto>(
      `/conversations/${conversationID}/messages`,
      { params },
    );
    return response.data;
  }

  static async clearConversationMessages(
    conversationId: string,
  ): Promise<ClearConversationMessagesResponseDto> {
    const response = await apiClient.delete<ClearConversationMessagesResponseDto>(
      `/conversations/${conversationId}/messages`,
    );
    return response.data;
  }

  static async searchConversationMessages(
    conversationId: string,
    q: string,
    params?: { limit?: number; cursor?: string },
  ): Promise<MessageHistoryResponseDto> {
    const response = await apiClient.get<MessageHistoryResponseDto>(
      `/conversations/${conversationId}/messages/search`,
      { params: { ...params, q } },
    );
    return response.data;
  }

  static async getMessageById(
    conversationId: string,
    messageId: string,
  ): Promise<MessageModel> {
    const response = await apiClient.get<MessageModel>(
      `/conversations/${conversationId}/messages/${messageId}`,
    );
    return response.data;
  }

  static async editMessage(
    conversationId: string,
    messageId: string,
    data: EditMessageDto,
  ): Promise<MessageModel> {
    const response = await apiClient.patch<MessageModel>(
      `/conversations/${conversationId}/messages/${messageId}`,
      data,
    );
    return response.data;
  }

  static async deleteMessage(
    conversationId: string,
    messageId: string,
  ): Promise<MessageModel> {
    const response = await apiClient.delete<MessageModel>(
      `/conversations/${conversationId}/messages/${messageId}`,
    );
    return response.data;
  }

  static async reactToMessage(
    conversationId: string,
    messageId: string,
    emoji: ReactionEmoji,
  ): Promise<MessageModel> {
    const response = await apiClient.put<MessageModel>(
      `/conversations/${conversationId}/messages/${messageId}/reaction`,
      { emoji },
    );
    return response.data;
  }

  static async unreactToMessage(
    conversationId: string,
    messageId: string,
  ): Promise<MessageModel> {
    const response = await apiClient.delete<MessageModel>(
      `/conversations/${conversationId}/messages/${messageId}/reaction`,
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

  // Receipts
  static async markIncomingMessageAsDelivered(
    conversationID: string,
    throughMessageId: string,
  ): Promise<ReceiptUpdateResponseDto> {
    const response = await apiClient.put<ReceiptUpdateResponseDto>(
      `/conversations/${conversationID}/receipts/delivered`,
      { throughMessageId },
    );
    return response.data;
  }

  static async markIncomingMessageAsRead(
    conversationID: string,
    throughMessageId: string,
  ): Promise<ReceiptUpdateResponseDto> {
    const response = await apiClient.put<ReceiptUpdateResponseDto>(
      `/conversations/${conversationID}/receipts/read`,
      { throughMessageId },
    );
    return response.data;
  }

  static async reconcileParticipantReadReceipts(
    conversationID: string,
  ): Promise<ConversationReceiptsGetResponse> {
    const response = await apiClient.get<ConversationReceiptsGetResponse>(
      `/conversations/${conversationID}/receipts`,
    );
    return response.data;
  }
}
