import { AppText, AppView, AppButton } from "@shared/components";
import { LogoSvg } from "@shared/components/svgs/assets";
import { AppColor } from "@shared/theme/color";
import { View } from "react-native";
import { OnboardingSlide } from "../components";
import { router } from "expo-router";
import StorageService, { StorageKey } from "@services/storage";

export default function OnboardingScreen() {
  return (
    <AppView withSafeArea className="bg-[#F7FFFA] p-0">
      <View className="flex flex-col h-full">
        <View className="self-center pt-8">
          <LogoSvg />
        </View>
        <OnboardingSlide />
        <View className="justify-self-end px-6 pt-8">
          <AppText variant="h3" className="pb-3 text-center">
            Stay connected with your friends and family
          </AppText>
          <AppText
            variant="body-md-regular"
            color="subtext"
            className={`px-6 pb-6 text-center text-[${AppColor.neutral300}]`}
          >
            ChatMe is messaging app that will help you to connect with everyone.
          </AppText>
          <AppButton
            onPress={async () => {
              await StorageService.save(StorageKey.OnboardingComplete, true);
              return router.replace("/signin");
            }}
          >
            Get Started
          </AppButton>
        </View>
      </View>
    </AppView>
  );
}
