import { AppRealtimeProvider } from "@components";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <AppRealtimeProvider enabled>
      <Stack screenOptions={{headerShown: false}} />
    </AppRealtimeProvider>
  );
}
