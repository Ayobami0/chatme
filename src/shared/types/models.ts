export interface UserModel {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  createdAt: string;
}

export type ConversationType = 'direct' | 'group';

export type GroupMemberRole = 'owner' | 'admin' | 'member';

export interface ConversationUser {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface GroupConversationParticipant {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: GroupMemberRole;
}

export interface ConversationSettings {
  archived: boolean;
  muted: boolean;
  pinned: boolean;
  favorited: boolean;
  archivedAt: string | null;
  mutedAt: string | null;
  mutedUntil: string | null;
  pinnedAt: string | null;
  favoritedAt: string | null;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}

export type MessageKind = 'text' | 'image' | 'audio' | 'video' | 'document';

export interface MessagePreviewModel {
  id: string;
  senderId: string;
  kind: MessageKind;
  preview: string;
  createdAt: string;
}

export interface BaseConversationModel {
  id: string;
  latestMessage: MessagePreviewModel | null;
  unreadCount: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt?: string;
  settings: ConversationSettings;
}

export interface DirectConversationModel extends BaseConversationModel {
  type: 'direct';
  otherParticipant: ConversationUser;
}

export interface GroupConversationModel extends BaseConversationModel {
  type: 'group';
  name: string;
  description?: string | null;
  avatarUrl: string | null;
  participants: GroupConversationParticipant[];
  role: GroupMemberRole;
}

export type ConversationModel = DirectConversationModel | GroupConversationModel;

export interface ConversationReceiptsState {
  messageId: string;
  at: string;
}

export interface ImageMessageAttachmentModel {
  mediaId: string;
  type: 'image';
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
  url: string;
}

export interface AudioMessageAttachmentModel {
  mediaId: string;
  type: 'audio';
  contentType: string;
  sizeBytes: number;
  durationMs: number;
  url: string;
}

export interface VideoMessageAttachmentModel {
  mediaId: string;
  type: 'video';
  contentType: string;
  sizeBytes: number;
  durationMs: number;
  width: number;
  height: number;
  url: string;
}

export interface DocumentMessageAttachmentModel {
  mediaId: string;
  type: 'document';
  contentType: string;
  sizeBytes: number;
  filename: string;
  url: string;
}

export type MessageAttachmentModel =
  | ImageMessageAttachmentModel
  | AudioMessageAttachmentModel
  | VideoMessageAttachmentModel
  | DocumentMessageAttachmentModel;

export interface MessageReactionModel {
  userId: string;
  emoji: string;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  clientMessageId: string;
  senderId: string;
  kind: MessageKind;
  text: string | null;
  attachments?: MessageAttachmentModel[];
  createdAt: string;
  replyToMessageId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  version?: number;
  reactions?: MessageReactionModel[];
}
