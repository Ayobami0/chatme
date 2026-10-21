import React from "react";
import { Text } from "react-native";
import { act, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { router, Stack } from "expo-router";

type MockAuth = {
  onboardingStatus: "complete";
  authStatus: "authenticated" | "unauthenticated";
  profileStatus: "complete" | "incomplete";
  profileFlowStage: "unknown" | "name" | "image";
};

let mockAuth: MockAuth;
const mockListeners = new Set<() => void>();
const setAuth = (patch: Partial<MockAuth>) =>
  act(() => {
    mockAuth = { ...mockAuth, ...patch };
    mockListeners.forEach((l) => l());
  });

jest.mock("@shared/context/auth-context", () => {
  const actual = jest.requireActual("@shared/context/auth-context");
  return {
    getSessionStage: actual.getSessionStage,
    useAuth: () =>
      require("react").useSyncExternalStore(
        (l: () => void) => (mockListeners.add(l), () => mockListeners.delete(l)),
        () => mockAuth,
      ),
  };
});
jest.mock("@features/auth/screens", () => ({ OnboardingScreen: () => null }));
jest.mock("@features/chat/screens", () => {
  const { Text: MockText } = require("react-native");
  return {
    ChatScreen: ({ conversationId }: { conversationId: string }) => (
      <MockText>chat {conversationId}</MockText>
    ),
  };
});
jest.mock("@features/chat/components/conversation-not-found", () => {
  const { Text: MockText } = require("react-native");
  return { ConversationNotFound: () => <MockText>not found</MockText> };
});

import { getSessionStage, useAuth } from "@shared/context/auth-context";
import { SessionStack } from "../session-stack";
import Index from "../../../app/index";
import ChatRoute from "../../../app/(app)/chat/[conversationId]/index";

function RootLayout() {
  return <SessionStack stage={getSessionStage(useAuth() as never)} />;
}

const screenNamed = (name: string) => {
  const Screen = () => <Text>{name}</Text>;
  Screen.displayName = `Screen(${name})`;
  return Screen;
};
function GroupLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
const routes = {
  _layout: RootLayout,
  index: Index,
  "(auth)/_layout": GroupLayout,
  "(profile-setup)/_layout": GroupLayout,
  "(app)/_layout": GroupLayout,
  "(auth)/signin": screenNamed("signin"),
  "(auth)/otp": screenNamed("otp"),
  "(profile-setup)/profile-name": screenNamed("profile-name"),
  "(profile-setup)/profile-image": screenNamed("profile-image"),
  "(app)/chats": screenNamed("chats"),
  "(app)/chat/[conversationId]/index": ChatRoute,
};

const signedIn: Partial<MockAuth> = { authStatus: "authenticated", profileStatus: "complete" };

describe("session routing", () => {
  beforeEach(() => {
    mockAuth = {
      onboardingStatus: "complete",
      authStatus: "unauthenticated",
      profileStatus: "incomplete",
      profileFlowStage: "unknown",
    };
  });

  it("keeps signed-out users out of the app", async () => {
    renderRouter(routes, { initialUrl: "/chats" });
    expect(await screen.findByText("signin")).toBeTruthy();
  });

  it("moves past OTP on sign-in and Back cannot return to it", async () => {
    renderRouter(routes, { initialUrl: "/signin" });
    act(() => router.push("/otp"));
    expect(await screen.findByText("otp")).toBeTruthy();

    await setAuth({ authStatus: "authenticated", profileStatus: "incomplete" });

    expect(await screen.findByText("profile-name")).toBeTruthy();
    expect(router.canGoBack()).toBe(false);
  });

  it("keeps the optional photo step open after the name completes the profile", async () => {
    mockAuth = { ...mockAuth, ...signedIn, profileFlowStage: "image" };
    renderRouter(routes, { initialUrl: "/" });
    expect(await screen.findByText("profile-image")).toBeTruthy();

    await setAuth({ profileFlowStage: "unknown" });
    expect(await screen.findByText("chats")).toBeTruthy();
  });

  it("logging out lands on sign-in and Back cannot return to the app", async () => {
    mockAuth = { ...mockAuth, ...signedIn };
    renderRouter(routes, { initialUrl: "/chats" });
    act(() => router.push("/chat/0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e"));
    expect(await screen.findByText("chat 0b8f6c2e-7c1a-4c55-9a0e-2f8d1c3b4a5e")).toBeTruthy();

    await setAuth({ authStatus: "unauthenticated" });

    expect(await screen.findByText("signin")).toBeTruthy();
    expect(router.canGoBack()).toBe(false);
  });

  it("opens a chat from its conversation id alone", async () => {
    mockAuth = { ...mockAuth, ...signedIn };
    renderRouter(routes, { initialUrl: "/chat/7d444840-9dc0-41d1-b245-5ffdce74fad2" });
    expect(await screen.findByText("chat 7d444840-9dc0-41d1-b245-5ffdce74fad2")).toBeTruthy();
  });

  it("fails safely on a malformed chat link", async () => {
    mockAuth = { ...mockAuth, ...signedIn };
    renderRouter(routes, { initialUrl: "/chat/%E0%A4%A" });
    expect(await screen.findByText("not found")).toBeTruthy();
  });
});
