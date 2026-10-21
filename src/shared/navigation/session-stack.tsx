import { Stack } from "expo-router";
import { SessionStage } from "@shared/context/auth-context";

/**
 * The root stack. Each route group is reachable only in its session stage. When a
 * guard turns false, the group's history is dropped and the user lands on `index`,
 * which routes them onward, so Back can't return to finished auth steps or, after
 * logout, to signed-in screens.
 */
export function SessionStack({ stage }: { stage: SessionStage }) {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={stage === "signed-out"}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={stage === "profile-setup"}>
        <Stack.Screen name="(profile-setup)" />
      </Stack.Protected>
      <Stack.Protected guard={stage === "app"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
