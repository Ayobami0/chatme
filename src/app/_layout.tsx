import { SplashScreen } from "expo-router";
import { SessionStack } from "@shared/navigation/session-stack";
import {
  configureNotificationHandler,
  useNotificationRouting,
} from "@features/notifications/hooks";
import "@shared/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { IsRestoringProvider, QueryClientProvider } from "@tanstack/react-query";

import { colorschemes } from "@shared/theme/colorschemes";
import { View } from "react-native";
import { client } from "@core/query";
import { usePersistedQueryCache } from "@core/query/persistence";
import { AppButton, AppText, AppToast } from "@components";
import { useEffect } from "react";
import {
  AuthProvider,
  getSessionStage,
  useAuth,
} from "@shared/context/auth-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export default function RootLayout() {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <RootContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { colorScheme } = useColorScheme();
  const auth = useAuth();
  const { initialize, initialized, user, startupFailed } = auth;
  const stage = getSessionStage(auth);
  const isRestoring = usePersistedQueryCache(client, user?.id);
  useNotificationRouting(initialized && stage === "app" && !isRestoring && !startupFailed);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);
  const style = colorschemes[colorScheme ?? "light"];

  if (!initialized) {
    return null;
  }

  return (
    <IsRestoringProvider value={isRestoring}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <View style={style} className="flex-1">
              {startupFailed ? (
                <StartupError onRetry={initialize} />
              ) : (
                <SessionStack stage={stage} />
              )}
            </View>
            <AppToast />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </IsRestoringProvider>
  );
}

function StartupError({ onRetry }: { onRetry: () => Promise<void> }) {
  return (
    <View className="flex-1 bg-background items-center justify-center gap-4 px-6">
      <AppText variant="h3">Can&apos;t reach ChatMe</AppText>
      <AppText color="subtext" variant="body-md-regular" className="text-center">
        Check your connection and try again. You&apos;re still signed in.
      </AppText>
      <AppButton className="w-full" onPress={() => void onRetry()}>
        Try again
      </AppButton>
    </View>
  );
}
