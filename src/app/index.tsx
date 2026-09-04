import { OnboardingScreen } from "@features/auth/screens";
import { useAuth } from "@shared/context/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const {
    onboardingStatus,
    profileFlowStage,
    profileStatus,
    authStatus,
  } = useAuth();

  if (onboardingStatus === "complete") {
    if (authStatus === "authenticated") {
      if (profileStatus === "complete") {
        return <Redirect href="/chats" />;
      }
      const stage = profileFlowStage === "unknown" ? "name" : profileFlowStage;
      return <Redirect href={`/profile-${stage}`} />;
    } else if (authStatus === "unauthenticated") {
      return <Redirect href="/signin" />;
    }
  }

  return <OnboardingScreen />;
}
