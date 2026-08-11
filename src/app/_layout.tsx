import { Stack } from "expo-router";
import "@shared/global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";

import { colorschemes } from "@shared/theme/colorschemes";
import { View } from "react-native";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  const style = colorschemes[colorScheme ?? 'light'];
  return (
    <SafeAreaProvider>
      <View style={style} className="flex-1">
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </SafeAreaProvider>
  );
}
