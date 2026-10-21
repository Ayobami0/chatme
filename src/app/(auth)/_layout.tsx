import { Stack } from "expo-router";

/** A layout makes this group one screen of the root stack, so its `Stack.Protected` guard applies. */
export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
