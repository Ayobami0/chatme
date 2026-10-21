import { AppRealtimeProvider } from "@components";
import { Redirect, Stack } from "expo-router";
import { useIsRestoring } from "@tanstack/react-query";
import { useAuth } from "@shared/context/auth-context";

export default function Layout() {
  const { authStatus, initialized } = useAuth();
  const isRestoring = useIsRestoring();

  if (initialized && authStatus === "unauthenticated") {
    return <Redirect href="/signin" />;
  }

  // Hydrate the cached account data before realtime events can write into it.
  if (isRestoring) return null;

  return (
    <AppRealtimeProvider enabled>
      <Stack screenOptions={{ headerShown: false }} />
    </AppRealtimeProvider>
  );
}
