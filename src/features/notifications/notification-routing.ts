import * as Notifications from "expo-notifications";
import { parseConversationId } from "@features/chat/navigation";

/**
 * The conversation a notification refers to, or undefined if the payload doesn't name
 * a valid one. Payloads are untrusted input: the id is validated before any routing.
 */
export function conversationIdFromNotification(
  notification: Notifications.Notification,
): string | undefined {
  const data = notification.request.content.data as Record<string, unknown> | undefined;
  return parseConversationId(data?.conversationId);
}

/** The conversation a tap should open; other actions (e.g. a future "reply") are ignored. */
export function conversationIdFromResponse(
  response: Notifications.NotificationResponse | null | undefined,
): string | undefined {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return undefined;
  }
  return conversationIdFromNotification(response.notification);
}
