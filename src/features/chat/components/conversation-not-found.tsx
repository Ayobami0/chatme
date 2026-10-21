import { AppButton, AppText, AppView } from "@components";
import { router } from "expo-router";
import { View } from "react-native";

/** Shown for malformed links or conversations the user can't access. */
export function ConversationNotFound() {
  return (
    <AppView withSafeArea>
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <AppText variant="h4" accessibilityRole="header">
          Chat not available
        </AppText>
        <AppText color="subtext" variant="body-md-regular" className="text-center">
          This conversation doesn&apos;t exist or you no longer have access to it.
        </AppText>
        <AppButton
          className="w-full"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/chats"))}
        >
          Back to chats
        </AppButton>
      </View>
    </AppView>
  );
}
