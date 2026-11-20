import { QueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { ConversationService } from "@services/conversation";
import { MediaService, UploadExpiredError } from "@services/media";
import { SessionHandle, TokenManager } from "@services/token-manager";
import { isStaleSession } from "@core/network/errors";
import { log } from "@logging";
import { applyMessages } from "../query/message-cache";
import { OutboxEntry, useOutboxStore } from "../store/outbox";

/** Sends in flight in this process, so a double tap or concurrent flush can't send twice. */
const inFlight = new Set<string>();

/**
 * Sends one outbox entry for `ownerId` within the session that is current when it
 * starts: uploads any attachments not uploaded yet, then posts the message with its
 * original `clientMessageId` so the server can deduplicate retries.
 *
 * Ownership is re-checked after every await. If the session ended (logout, another
 * account, or a re-login) the work stops before its next request and writes nothing:
 * not to the outbox, the message cache or the upload progress of the next session.
 */
export async function deliverOutboxEntry(
  queryClient: QueryClient,
  clientMessageId: string,
  ownerId: string,
) {
  const entry = useOutboxStore.getState().entries[clientMessageId];
  if (!entry || entry.senderId !== ownerId || inFlight.has(clientMessageId)) return;

  const session = TokenManager.captureSession();
  inFlight.add(clientMessageId);
  try {
    await deliver(queryClient, entry, session);
  } finally {
    inFlight.delete(clientMessageId);
  }
}

async function deliver(
  queryClient: QueryClient,
  entry: OutboxEntry,
  session: SessionHandle,
  { rotatedExpiredUpload = false } = {},
) {
  const { clientMessageId } = entry;
  // Writes to the outbox only happen while the session that owns the entry is current.
  const update = (patch: Partial<OutboxEntry>) => {
    session.assertCurrent();
    useOutboxStore.getState().update(clientMessageId, patch);
  };

  update({ status: "pending" });
  const attachments = [...entry.attachments];

  try {
    for (const [index, attachment] of attachments.entries()) {
      if (attachment.mediaId) continue;
      const media = await MediaService.uploadMedia(
        {
          uri: attachment.localUri,
          purpose: "message_attachment",
          contentType: attachment.contentType,
          originalFilename: attachment.fileName,
          sizeBytes: attachment.sizeBytes,
          clientUploadId: attachment.clientUploadId,
        },
        { session },
      );
      attachments[index] = { ...attachment, mediaId: media.id };
      update({ attachments: [...attachments] });
    }

    const mediaIds = attachments.map((a) => a.mediaId!).filter(Boolean);
    session.assertCurrent();
    const message = await ConversationService.sendMessage(
      entry.conversationId,
      {
        text: entry.text || undefined,
        clientMessageId,
        attachmentMediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      },
      { sessionGeneration: session.generation },
    );

    // Publish only into the session that sent it.
    session.assertCurrent();
    applyMessages(queryClient, entry.conversationId, [message]);
    useOutboxStore.getState().remove(clientMessageId);
    attachments.forEach((a) => MediaService.forgetUpload(a.clientUploadId));
  } catch (error) {
    if (isStaleSession(error) || !session.isCurrent()) return;

    if (error instanceof UploadExpiredError && !rotatedExpiredUpload) {
      // The storage authorization expired: start those uploads over with fresh ids, once.
      const rotated = attachments.map((a) =>
        a.mediaId ? a : { ...a, clientUploadId: Crypto.randomUUID() },
      );
      update({ attachments: rotated });
      return deliver(queryClient, { ...entry, attachments: rotated }, session, {
        rotatedExpiredUpload: true,
      });
    }

    log.warn("Message send failed", (error as Error)?.message);
    update({ status: "failed" });
  }
}

/** Re-sends `ownerId`'s entries left `pending` by an interrupted send (e.g. the app was killed). */
export function flushInterruptedSends(
  queryClient: QueryClient,
  conversationId: string,
  ownerId: string,
) {
  const entries = Object.values(useOutboxStore.getState().entries);
  for (const entry of entries) {
    if (
      entry.conversationId === conversationId &&
      entry.senderId === ownerId &&
      entry.status === "pending"
    ) {
      void deliverOutboxEntry(queryClient, entry.clientMessageId, ownerId);
    }
  }
}
