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
  latestMessage?: undefined;
  unreadCount: number;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
