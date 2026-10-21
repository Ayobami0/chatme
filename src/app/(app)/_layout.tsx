import { AppRealtimeProvider } from "@components";
import { Stack } from "expo-router";
import { useIsRestoring } from "@tanstack/react-query";

/** Access is guarded by the root `Stack.Protected`; this only gates on cache restore. */
export default function Layout() {
  const isRestoring = useIsRestoring();

  // Hydrate the cached account data before realtime events can write into it.
  if (isRestoring) return null;

  return (
    <AppRealtimeProvider enabled>
      <Stack screenOptions={{ headerShown: false }} />
    </AppRealtimeProvider>
  );
}
