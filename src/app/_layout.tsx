import { SplashScreen, Stack } from "expo-router";
import "@shared/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { QueryClientProvider } from "@tanstack/react-query";

import { colorschemes } from "@shared/theme/colorschemes";
import { View } from "react-native";
import { client } from "@core/query";
import { AppToast } from "@components";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@shared/context/auth-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootContent />
    </AuthProvider>
  );
}

function RootContent() {
  const { colorScheme } = useColorScheme();
  const { initialize, initialized } = useAuth();

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
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <View style={style} className="flex-1">
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        <AppToast />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
