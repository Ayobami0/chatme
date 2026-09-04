export interface UserModel {
  id: string;
  phoneNumber: string;
  displayName: string;
  avatarUrl: string;
  profileComplete: boolean;
  createdAt: string;
}

export type ConversationType = 'direct';

export type ConversationUser = Omit<UserModel, 'phoneNumber' | 'profileComplete' | 'createdAt'>

export interface ConversationModel {
  id: string;
  type: ConversationType;
  otherParticipant: ConversationUser;
  latestMessage?: MessagePreviewModel;
  unreadCount: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MessageKind = 'text';

export interface MessagePreviewModel {
  id: string;
  preview?: string;
  createdAt: string;
  kind: MessageKind;
  senderId: string;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: MessageKind;
  text: string;
  createdAt: string;
}
