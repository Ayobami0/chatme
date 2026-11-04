import { useRealtime } from "@components";
import {
  PresenceChangedEventPayload,
  PresenceSubscriptionData,
  RealtimeAck,
  TypingStartedEventPayload,
  TypingStoppedEventPayload,
} from "@shared/types/realtime";
import { useCallback, useEffect, useRef, useState } from "react";

/** How often `typing.start` is re-sent while the user keeps typing. */
const TYPING_THROTTLE_MS = 3_000;
/** How long after the last keystroke `typing.stop` is sent. */
const TYPING_IDLE_MS = 4_000;

/**
 * Presence and typing for a conversation.
 * - Tracks which other members are typing (direct and group chats) until each
 *   server-provided expiry, and whether the other direct-chat participant is online.
 * - `notifyTyping` emits throttled `typing.start`; `stopTyping` emits `typing.stop`
 *   (also sent automatically after idle and on unmount).
 */
export function usePresenceAndTyping(
  conversationId: string,
  options: { selfId?: string; directParticipantId?: string },
) {
  const { selfId, directParticipantId } = options;
  const { socket, status } = useRealtime();
  const [isOnline, setIsOnline] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const expiryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTyping = useCallback((userId?: string) => {
    const timers = expiryTimers.current;
    for (const [id, timer] of timers) {
      if (userId && id !== userId) continue;
      clearTimeout(timer);
      timers.delete(id);
    }
    setTypingUserIds((ids) => (userId ? ids.filter((id) => id !== userId) : []));
  }, []);

  const showTypingUntil = useCallback(
    (userId: string, expiresAt: string) => {
      const delay = Math.max(0, Date.parse(expiresAt) - Date.now());
      const timers = expiryTimers.current;
      if (timers.has(userId)) clearTimeout(timers.get(userId));
      if (delay === 0) return clearTyping(userId);

      timers.set(userId, setTimeout(() => clearTyping(userId), delay));
      setTypingUserIds((ids) => (ids.includes(userId) ? ids : [...ids, userId]));
    },
    [clearTyping],
  );

  useEffect(() => {
    if (!socket || status !== "connected") return;
    let active = true;
    const isOther = (userId: string) => userId !== selfId;

    const subscribe = () => {
      socket.emit(
        "presence.subscribe",
        { conversationId },
        (response: RealtimeAck<PresenceSubscriptionData>) => {
          if (!active || !response.ok) return;
          const participant = response.data.participants.find(
            (p) => p.userId === directParticipantId,
          );
          setIsOnline(participant?.status === "online");
          clearTyping();
          response.data.typing
            .filter((t) => isOther(t.userId))
            .forEach((t) => showTypingUntil(t.userId, t.expiresAt));
        },
      );
    };

    const onPresence = (event: PresenceChangedEventPayload) => {
      if (event.conversationId === conversationId && event.userId === directParticipantId) {
        setIsOnline(event.status === "online");
      }
    };
    const onTypingStarted = (event: TypingStartedEventPayload) => {
      if (event.conversationId === conversationId && isOther(event.userId)) {
        showTypingUntil(event.userId, event.expiresAt);
      }
    };
    const onTypingStopped = (event: TypingStoppedEventPayload) => {
      if (event.conversationId === conversationId) clearTyping(event.userId);
    };
    const onDisconnect = () => {
      setIsOnline(false);
      clearTyping();
    };

    socket.on("connect", subscribe);
    socket.on("presence.changed", onPresence);
    socket.on("typing.started", onTypingStarted);
    socket.on("typing.stopped", onTypingStopped);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) subscribe();

    return () => {
      active = false;
      socket.off("connect", subscribe);
      socket.off("presence.changed", onPresence);
      socket.off("typing.started", onTypingStarted);
      socket.off("typing.stopped", onTypingStopped);
      socket.off("disconnect", onDisconnect);
      if (socket.connected) {
        socket.emit("presence.unsubscribe", { conversationId }, () => undefined);
      }
    };
  }, [socket, status, conversationId, selfId, directParticipantId, showTypingUntil, clearTyping]);

  // Outgoing typing state.
  const lastStartSentAt = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef(socket);
  socketRef.current = socket;

  const stopTyping = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = null;
    if (lastStartSentAt.current === 0) return;
    lastStartSentAt.current = 0;
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing.stop", { conversationId }, () => undefined);
    }
  }, [conversationId]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (socketRef.current?.connected && now - lastStartSentAt.current >= TYPING_THROTTLE_MS) {
      lastStartSentAt.current = now;
      socketRef.current.emit("typing.start", { conversationId }, () => undefined);
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  }, [conversationId, stopTyping]);

  useEffect(() => {
    const timers = expiryTimers.current;
    return () => {
      stopTyping();
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [stopTyping]);

  return { isOnline, typingUserIds, notifyTyping, stopTyping };
}
