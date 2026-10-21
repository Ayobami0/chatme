import { AppHeader, AppText, AppView } from "@components";
import { router } from "expo-router";
import { PinCode } from "../components/pin-code";
import { View } from "react-native";

export default function PinCodeSetupScreen() {
  return <AppView withSafeArea>
    <AppHeader onBack={router.back} />
    <View className="pt-20 justify-center items-center gap-3">
      <AppText variant='h3'>Setup pin code</AppText>
      <AppText variant='body-md-regular' color='subtext' className="px-14 text-center">Make sure the code is safe and no one else knows.</AppText>
    </View>
  <PinCode />
  </AppView>
}
