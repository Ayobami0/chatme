import { AppRealtimeProvider } from "@components";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@shared/context/auth-context";

export default function Layout() {
  const { authStatus, initialized } = useAuth();

  if (initialized && authStatus === "unauthenticated") {
    return <Redirect href="/signin" />;
  }

  return (
    <AppRealtimeProvider enabled>
      <Stack screenOptions={{ headerShown: false }} />
    </AppRealtimeProvider>
  );
}
