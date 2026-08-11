import { AppText, AppView, AppButton } from "@shared/components";
import { View } from "react-native";

export default function SignInScreen() {
  return (
    <AppView withSafeArea className="bg-[#F7FFFA] p-0">
      <View className="flex flex-col h-full items-start px-6 pt-16">
        <AppText variant="h3" className="pb-3">What's your phone number?</AppText>
        <AppText color='subtext' variant="body-md-regular" className="pb-6">We will send you the verification code.</AppText>
        <View className="flex-1 justify-end w-full">
          <AppButton className="w-full" disabled>Next</AppButton>
        </View>
      </View>
    </AppView>
  );
}
