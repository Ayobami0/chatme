import { QueryClient } from "@tanstack/react-query";
import { ConversationService } from "@services/conversation";
import { MediaService } from "@services/media";
import { log } from "@logging";
import { applyMessages } from "../query/message-cache";
import { useOutboxStore } from "../store/outbox";

/** Sends in flight in this process, so a double tap or concurrent flush can't send twice. */
const inFlight = new Set<string>();

/**
 * Sends one outbox entry: uploads any attachments not uploaded yet, then posts the
 * message with its original `clientMessageId` so the server can deduplicate retries.
 * On success the server copy replaces the entry; on failure it stays as `failed`.
 */
export async function deliverOutboxEntry(queryClient: QueryClient, clientMessageId: string) {
  if (inFlight.has(clientMessageId)) return;
  const store = useOutboxStore.getState();
  const entry = store.entries[clientMessageId];
  if (!entry) return;

  inFlight.add(clientMessageId);
  store.update(clientMessageId, { status: "pending" });

  try {
    const attachments = [...entry.attachments];
    for (const [index, attachment] of attachments.entries()) {
      if (attachment.mediaId) continue;
      const media = await MediaService.uploadMedia({
        uri: attachment.localUri,
        purpose: "message_attachment",
        contentType: attachment.contentType,
        originalFilename: attachment.fileName,
        sizeBytes: attachment.sizeBytes,
        clientUploadId: attachment.clientUploadId,
      });
      attachments[index] = { ...attachment, mediaId: media.id };
      useOutboxStore.getState().update(clientMessageId, { attachments: [...attachments] });
    }

    const mediaIds = attachments.map((a) => a.mediaId!).filter(Boolean);
    const message = await ConversationService.sendMessage(entry.conversationId, {
      text: entry.text || undefined,
      clientMessageId,
      attachmentMediaIds: mediaIds.length > 0 ? mediaIds : undefined,
    });

    applyMessages(queryClient, entry.conversationId, [message]);
    useOutboxStore.getState().remove(clientMessageId);
  } catch (error) {
    log.warn("Message send failed", (error as Error)?.message);
    useOutboxStore.getState().update(clientMessageId, { status: "failed" });
  } finally {
    inFlight.delete(clientMessageId);
  }
}

/** Re-sends entries left `pending` by an interrupted send (e.g. the app was killed). */
export function flushInterruptedSends(queryClient: QueryClient, conversationId: string) {
  const entries = Object.values(useOutboxStore.getState().entries);
  for (const entry of entries) {
    if (entry.conversationId === conversationId && entry.status === "pending") {
      void deliverOutboxEntry(queryClient, entry.clientMessageId);
    }
  }
}
