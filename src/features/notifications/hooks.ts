import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { log } from "@logging";
import { getActiveConversation } from "./active-conversation";
import {
  conversationIdFromNotification,
  conversationIdFromResponse,
} from "./notification-routing";
import { registerForPushNotifications } from "./push-registration";

/** Foreground behaviour: no banner for the chat the user is already looking at. */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isOpenChat =
        conversationIdFromNotification(notification) === getActiveConversation();
      return {
        shouldShowBanner: !isOpenChat,
        shouldShowList: !isOpenChat,
        shouldPlaySound: !isOpenChat,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Registers for push while signed in to the app. Retries a failed attempt (e.g.
 * offline) when the app returns to the foreground, and re-registers when Expo
 * rotates the token.
 */
export function usePushRegistration() {
  const registered = useRef(false);

  useEffect(() => {
    let active = true;

    const register = async (token?: string) => {
      try {
        // "denied" and "unavailable" are final for this session; only errors are retried.
        await registerForPushNotifications(token);
        if (active) registered.current = true;
      } catch (error) {
        log.warn("Push registration failed", (error as Error)?.message);
      }
    };

    void register();
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      // The listener receives the native token; ask again for the Expo token.
      void register();
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && !registered.current) void register();
    });

    return () => {
      active = false;
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);
}

/**
 * Opens the chat a notification was tapped for, both from a cold start and while
 * running. The tap is held until the session is restored and the app stage is
 * active (`ready`), then routed through the id-only chat route, which validates
 * access and shows "not available" otherwise.
 */
export function useNotificationRouting(ready: boolean) {
  const [pendingId, setPendingId] = useState<string>();

  useEffect(() => {
    let active = true;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const id = conversationIdFromResponse(response);
      if (active && id) setPendingId(id);
    });
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = conversationIdFromResponse(response);
      if (id) setPendingId(id);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!ready || !pendingId) return;
    setPendingId(undefined);
    void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    // Let the stage's initial redirect (to /chats) settle, so the chat opens on top of it.
    requestAnimationFrame(() =>
      router.push({ pathname: "/chat/[conversationId]", params: { conversationId: pendingId } }),
    );
  }, [ready, pendingId]);
}
