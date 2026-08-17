import { OnboardingScreen } from "@features/auth/screens";
import { useSessionStore } from "@shared/store/session";
import { Redirect } from "expo-router";
import {log} from "@core/logging";

export default function Index() {
  const {
    onboardingStatus,
    profileFlowStage,
    profileStatus,
    authStatus,
  } = useSessionStore();

  if (onboardingStatus === "complete") {
    if (authStatus === "authenticated") {
      if (profileStatus === "complete") {
        return <Redirect href="/home" />;
      }
      const stage = profileFlowStage === "unknown" ? "name" : profileFlowStage;
      return <Redirect href={`/profile-${stage}`} />;
    } else if (authStatus === "unauthenticated") {
      return <Redirect href="/signin" />;
    }
  }

  return <OnboardingScreen />;
}
