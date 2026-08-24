import {
  SolidChatSvg,
  SolidCogSvg,
  SolidPhoneSvg,
} from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";

export default function AppLayout() {
  const { colorScheme } = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:
            colorScheme === "dark" ? AppColor.neutral700 : AppColor.white,
          shadowColor: "#0B131B",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
          elevation: 8,
        },
        tabBarActiveTintColor: AppColor.primary300,
        tabBarInactiveTintColor: AppColor.neutral300,
        tabBarIconStyle: {
          fontSize: 28,
        },
      }}
    >
      <Tabs.Screen
        name="call"
        options={{
          tabBarLabel: "Call",
          tabBarIcon: ({ color, size }) => (
            <SolidPhoneSvg color={color} fontSize={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          tabBarLabel: "Chats",
          tabBarIcon: ({ color, size }) => (
            <SolidChatSvg color={color} fontSize={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SolidCogSvg color={color} fontSize={size} />
          ),
        }}
      />
    </Tabs>
  );
}
