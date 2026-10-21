import { AppAvatar, AppButton, AppText, AppView } from "@components";
import { useAuth } from "@shared/context/auth-context";
import { useState } from "react";
import { Alert, View } from "react-native";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Logging out ends the session; the root route guards drop the app's history,
  // so Back can't return to signed-in screens.
  const confirmLogout = () =>
    Alert.alert("Log out?", "Unsent messages and drafts on this device will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
        },
      },
    ]);

  return (
    <AppView className="p-0">
      <View className="pt-[60] px-6 bg-primary pb-4">
        <AppText variant="h3" color="onPrimary" className="pt-[21]" accessibilityRole="header">
          Settings
        </AppText>
      </View>
      <View className="flex-1 px-6 pt-6 gap-6">
        <View className="flex-row items-center gap-4">
          <AppAvatar url={user?.avatarUrl ?? undefined} name={user?.displayName ?? ""} size={56} isOnline={false} />
          <View className="flex-1">
            <AppText variant="body-lg-semibold">{user?.displayName}</AppText>
            <AppText variant="body-md-regular" color="subtext">
              {user?.phoneNumber}
            </AppText>
          </View>
        </View>
        <View className="flex-1 justify-end pb-6">
          <AppButton
            className="w-full"
            variant="secondary"
            isLoading={isLoggingOut}
            disabled={isLoggingOut}
            onPress={confirmLogout}
          >
            Log out
          </AppButton>
        </View>
      </View>
    </AppView>
  );
}
