import {
  SolidChatSvg,
  SolidCogSvg,
  SolidPhoneSvg,
} from "@shared/components/svgs/icons";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import { Tabs } from "expo-router";

export default function AppLayout() {
  const surfaceColor = useThemeColor("surface");
  const primaryColor = useThemeColor("primary");
  const subtextColor = useThemeColor("subtext");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: surfaceColor,
          shadowColor: "#0B131B",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.06,
          shadowRadius: 24,
          elevation: 8,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: subtextColor,
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
