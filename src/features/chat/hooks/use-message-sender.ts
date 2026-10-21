import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@shared/context/auth-context";
import { MessageAttachmentModel, MessageKind, MessageModel } from "@shared/types/models";
import { deliverOutboxEntry, flushInterruptedSends } from "../outbox/deliver";
import { OutboxAttachment, OutboxEntry, useOutboxStore } from "../store/outbox";

export type LocalMessage = MessageModel & { localStatus: OutboxEntry["status"] };

const toLocalMessage = (entry: OutboxEntry): LocalMessage => ({
  id: entry.clientMessageId,
  clientMessageId: entry.clientMessageId,
  conversationId: entry.conversationId,
  senderId: entry.senderId,
  kind: entry.kind,
  text: entry.text || null,
  // Preview from the local file until the server copy (with its URL) replaces it.
  attachments: entry.attachments.map(
    (a) =>
      ({
        mediaId: a.mediaId ?? "",
        type: a.type,
        contentType: a.contentType ?? "",
        sizeBytes: a.sizeBytes,
        url: a.localUri,
        filename: a.fileName,
      }) as MessageAttachmentModel,
  ),
  createdAt: entry.createdAt,
  localStatus: entry.status,
});

/**
 * Sending for one conversation, backed by the persisted outbox.
 * `confirmedMessages` are the server messages already shown; an entry the server
 * has accepted (via a send response *or* its socket echo) is dropped from the outbox.
 */
export function useMessageSender(
  conversationId: string,
  confirmedMessages: MessageModel[],
  options: { reconnectVersion: number },
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const entries = useOutboxStore(
    useShallow((s) =>
      Object.values(s.entries).filter(
        (e) => e.conversationId === conversationId && e.senderId === user?.id,
      ),
    ),
  );

  // Reconcile: a confirmed message with the entry's clientMessageId means it was delivered.
  useEffect(() => {
    const confirmedIds = new Set(confirmedMessages.map((m) => m.clientMessageId));
    for (const entry of entries) {
      if (confirmedIds.has(entry.clientMessageId)) {
        useOutboxStore.getState().remove(entry.clientMessageId);
      }
    }
  }, [confirmedMessages, entries]);

  // Resume sends interrupted by a restart, once the outbox is loaded and whenever we reconnect.
  useEffect(() => {
    const flush = () => flushInterruptedSends(queryClient, conversationId);
    if (useOutboxStore.persist.hasHydrated()) flush();
    return useOutboxStore.persist.onFinishHydration(flush);
  }, [queryClient, conversationId, options.reconnectVersion]);

  const send = useCallback(
    (text: string, kind: MessageKind, attachments: OutboxAttachment[] = []) => {
      if (!user) return;
      const clientMessageId = Crypto.randomUUID();
      useOutboxStore.getState().put({
        clientMessageId,
        conversationId,
        senderId: user.id,
        kind,
        text,
        attachments,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      void deliverOutboxEntry(queryClient, clientMessageId);
    },
    [conversationId, queryClient, user],
  );

  const retry = useCallback(
    (clientMessageId: string) => void deliverOutboxEntry(queryClient, clientMessageId),
    [queryClient],
  );

  const discard = useCallback(
    (clientMessageId: string) => useOutboxStore.getState().remove(clientMessageId),
    [],
  );

  const localMessages = useMemo(() => entries.map(toLocalMessage), [entries]);

  return { localMessages, send, retry, discard };
}
