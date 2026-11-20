/** The API rejects message text longer than this (`SendMessageDto.text.maxLength`). */
export const MAX_MESSAGE_LENGTH = 4000;

export type MessageDraft = {
  text: string;
  attachmentCount?: number;
};

/**
 * Whether a draft can be sent: it needs non-whitespace text or at least one
 * attachment, and its text must fit the API limit.
 */
export function canSendMessage({ text, attachmentCount = 0 }: MessageDraft): boolean {
  const trimmed = text.trim();
  if (trimmed.length > MAX_MESSAGE_LENGTH) return false;
  return trimmed.length > 0 || attachmentCount > 0;
}
