import { StringUnitLength } from "luxon";
import { ConversationModel, ConversationUser } from "./models";

// PAGINATION
export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: {
    nextCursor: string;
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

export interface VerifyPhoneVerificationRequest {
  challengeId: string;
  code: string;
  device: {
    name: string;
    platform: string;
  };
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

// PROFILE
export interface UserGetResponse {
  id: string;
  phoneNumber: string;
  displayName: string;
  avatarUrl: string;
  profileComplete: boolean;
  createdAt: string;
}

export interface UserUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
}

// CONVERSATIONS
export type ConversationsGetResponse = PaginatedResponse<ConversationModel>;

export type ConversationGetResponse = ConversationModel;

export interface ConversationPutRequest {
  participantId: "7d444840-9dc0-11d1-b245-5ffdce74fad2";
}

export type ConversationPutResponse = ConversationGetResponse;

export interface ConversationMessagePostRequest {
  clientMessageId: string;
  text: string;
}

export interface ConversationMessageReadResponse {
  conversationId: string;
  lastReadAt: string;
  unreadCount: number;
}

// Discovery
export interface MatchContactsRequest {
  phoneNumbers: string[];
}

export interface MatchContactsResponse {
  matches: [
    {
      matchedPhoneNumber: string;
      user: ConversationUser;
    },
  ];
}

export type SearchContactsResponse = PaginatedResponse<ConversationUser>;
