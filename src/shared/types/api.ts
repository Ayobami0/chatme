import {
  ConversationModel,
  ConversationReceiptsState,
  ConversationSettings,
  ConversationUser,
  GroupMemberRole,
  MessageModel,
} from "./models";

// PAGINATION
export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

// AUTH
export interface PhoneVerificationRequest {
  phoneNumber: string;
}

export interface PhoneVerificationResponse {
  challengeId: string;
  phoneNumberMasked: string;
  expiresInSeconds: number;
  resendInSeconds: number;
  codeLength: number;
}

export interface ResendPhoneVerificationRequest {
  challengeId: string;
}

export interface AuthDeviceDto {
  name?: string;
  platform?: "ios" | "android" | "web" | "unknown";
}

export interface VerifyPhoneVerificationRequest {
  challengeId: string;
  code: string;
  device?: AuthDeviceDto;
}

export interface VerifyPhoneVerificationResponse {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  refreshTokenExpiresInSeconds: number;
  user: UserGetResponse;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

// PROFILE & BLOCKS
export interface UserGetResponse {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  createdAt: string;
}

export interface UserUpdateRequest {
  displayName?: string;
}

export interface SetProfileAvatarRequest {
  mediaId: string;
}

export interface BlockedPublicUserDto {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface BlockResponseDto {
  user: BlockedPublicUserDto;
  blockedAt: string;
}

export interface BlockListResponseDto {
  items: BlockResponseDto[];
}

// CONVERSATIONS
export type ConversationsGetResponse = PaginatedResponse<ConversationModel>;

export type ConversationGetResponse = ConversationModel;

export interface CreateDirectConversationDto {
  participantId: string;
}

export interface CreateGroupConversationDto {
  name: string;
  participantIds: string[];
  avatarMediaId?: string | null;
}

export interface UpdateGroupConversationDto {
  name?: string;
  avatarMediaId?: string | null;
}

export interface SetGroupAvatarDto {
  mediaId: string;
}

export interface AddGroupMembersDto {
  participantIds: string[];
}

export interface UpdateGroupMemberRoleDto {
  role: "admin" | "member";
}

export interface TransferGroupOwnershipDto {
  newOwnerId: string;
}

export interface ConversationPutRequest {
  participantId: string;
}

export type ConversationPutResponse = ConversationGetResponse;

// CONVERSATION SETTINGS
export interface UpdateConversationSettingsDto {
  archived?: boolean;
  muted?: boolean;
  pinned?: boolean;
}

export type MuteDuration = "8_hours" | "24_hours" | "7_days" | "always";

export interface MuteConversationDto {
  duration: MuteDuration;
}

export interface ConversationSettingsResponseDto extends ConversationSettings {
  conversationId: string;
}

// MESSAGES
export interface ConversationMessagePostRequest {
  clientMessageId: string;
  text?: string;
  replyToMessageId?: string;
  attachmentMediaIds?: string[];
}

export interface EditMessageDto {
  text: string | null;
  expectedVersion: number;
}

export type ReactionEmoji = "👍" | "❤️" | "😂" | "😮" | "😢" | "🙏";

export interface SetMessageReactionDto {
  emoji: ReactionEmoji;
}

export interface ClearConversationMessagesResponseDto {
  conversationId: string;
  changed: boolean;
  clearedAt: string | null;
  clearedThroughMessageId: string | null;
}

export interface ConversationReadStateResponseDto {
  conversationId: string;
  lastReadAt: string;
  unreadCount: number;
}

export interface ConversationMessageReadResponse {
  conversationId: string;
  lastReadAt: string;
  unreadCount: number;
}

export type MessageHistoryResponseDto = PaginatedResponse<MessageModel>;

// DISCOVERY
export interface MatchContactsRequest {
  phoneNumbers: string[];
}

export interface PublicDiscoveryUserDto {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ContactMatchDto {
  matchedPhoneNumber: string;
  user: PublicDiscoveryUserDto;
}

export interface MatchContactsResponse {
  matches: ContactMatchDto[];
}

export type SearchContactsResponse = PaginatedResponse<PublicDiscoveryUserDto>;

// RECEIPTS
export interface UpdateReceiptDto {
  throughMessageId: string;
}

export interface ReceiptBoundaryResponseDto {
  messageId: string;
  at: string;
}

export interface ReceiptUpdateResponseDto {
  conversationId: string;
  status: "delivered" | "read";
  throughMessageId: string;
  at: string;
  changed: boolean;
  unreadCount: number;
  version: number;
  delivered: ReceiptBoundaryResponseDto;
  read: ReceiptBoundaryResponseDto | null;
}

export interface ReceiptFrontierResponseDto {
  userId: string;
  version: number;
  delivered: ReceiptBoundaryResponseDto | null;
  read: ReceiptBoundaryResponseDto | null;
}

export interface ConversationReceiptsGetResponse {
  conversationId: string;
  items: ReceiptFrontierResponseDto[];
}

// MEDIA
export type MediaPurpose = "profile_avatar" | "group_avatar" | "message_attachment";
export type MediaStatus = "pending" | "ready" | "failed" | "deleted";
export type MediaType = "image" | "audio" | "video" | "document";

export interface CreateMediaUploadDto {
  clientUploadId: string;
  purpose: MediaPurpose;
  contentType: string;
  sizeBytes: number;
  contentSha256?: string;
  originalFilename?: string;
}

export interface MediaAssetResponseDto {
  id: string;
  purpose: MediaPurpose;
  status: MediaStatus;
  type: MediaType;
  contentType: string;
  sizeBytes: number;
  originalFilename?: string | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  secureUrl?: string | null;
  createdAt: string;
  expiresAt: string;
  completedAt?: string | null;
}

export interface CloudinaryUploadFieldsDto {
  api_key: string;
  timestamp: string;
  signature: string;
  public_id: string;
  context: string;
  type: "upload";
  overwrite: "false";
  allowed_formats: string;
  upload_preset: string;
  transformation?: string;
}

export interface CloudinaryUploadAuthorizationDto {
  url: string;
  method: "POST";
  expiresAt: string;
  fields: CloudinaryUploadFieldsDto;
}

export interface CreateMediaUploadResponseDto {
  media: MediaAssetResponseDto;
  upload: CloudinaryUploadAuthorizationDto | null;
}

// PUSH NOTIFICATIONS
export type PushDevicePlatform = "ios" | "android";

export interface RegisterPushDeviceDto {
  platform: PushDevicePlatform;
  token: string;
}

export interface PushDeviceResponseDto {
  installationId: string;
  platform: PushDevicePlatform;
  registeredAt: string;
}

// HEALTH
export interface HealthResponseDto {
  status: string;
  service: string;
}
