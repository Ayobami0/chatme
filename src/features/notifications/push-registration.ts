import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { PushService } from "@services/push";
import { log } from "@logging";
import { getInstallationId } from "./installation-id";

export const MESSAGES_CHANNEL_ID = "messages";

export type PushRegistrationResult = "registered" | "denied" | "unavailable";

const projectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Registers this installation's Expo push token for the signed-in login. Safe to
 * repeat: the server rotates the token for the same installation id. Pass `token`
 * when it is already known (e.g. from a token-change event).
 */
export async function registerForPushNotifications(token?: string): Promise<PushRegistrationResult> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return "unavailable";
  if (!Device.isDevice) return "unavailable";

  if (Platform.OS === "android") {
    // Android 13+ only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync(MESSAGES_CHANNEL_ID, {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  if (!(await ensurePermission())) return "denied";

  const id = projectId();
  if (!token && !id) {
    log.warn("Push disabled: no EAS projectId in app config (run `eas init`).");
    return "unavailable";
  }

  const expoToken = token ?? (await Notifications.getExpoPushTokenAsync({ projectId: id })).data;
  await PushService.registerDevice(await getInstallationId(), {
    platform: Platform.OS,
    token: expoToken,
  });
  return "registered";
}

/** Best effort: the server also drops registrations when the login is revoked. */
export async function unregisterFromPushNotifications() {
  await PushService.unregisterDevice(await getInstallationId());
}
