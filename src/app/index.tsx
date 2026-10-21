import { OnboardingScreen } from "@features/auth/screens";
import { getSessionStage, useAuth } from "@shared/context/auth-context";
import { Redirect } from "expo-router";

/** The anchor route: every guard change lands here and is sent to the stage's first screen. */
export default function Index() {
  const auth = useAuth();

  if (auth.onboardingStatus !== "complete") return <OnboardingScreen />;

  switch (getSessionStage(auth)) {
    case "signed-out":
      return <Redirect href="/signin" />;
    case "profile-setup":
      return (
        <Redirect href={auth.profileFlowStage === "image" ? "/profile-image" : "/profile-name"} />
      );
    case "app":
      return <Redirect href="/chats" />;
  }
}
