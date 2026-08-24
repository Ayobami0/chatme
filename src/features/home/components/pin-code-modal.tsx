import { AppBlurView, AppButton, AppText } from "@components";
import { AppFullScreenModal } from "@shared/components/app-fullscreen-modal";
import { router } from "expo-router";
import { Modal, Pressable, View } from "react-native";

type PinCodeModalProps = {
  onClose: (isSet?: boolean) => void;
  isVisible: boolean;
};

export function PinCodeModal(props: PinCodeModalProps) {
  const { isVisible, onClose } = props;

  return (
    <AppFullScreenModal
      visible={isVisible}
      onClose={() => {
        onClose();
      }}
      transparent
      animationType="fade"
    >
      <View className="size-full justify-center items-center">
        <View className="bg-surface rounded-2xl p-6 gap-[27]">
          <View className="gap-2 items-center justify-center">
            <AppText variant="h4">Do you want to add a pin code?</AppText>
            <AppText color="subtext" size={14} className="mx-7 text-center">
              Add a verification code to make it more secure.
            </AppText>
          </View>
          <View className="gap-2">
            <AppButton onPress={() => {
              router.navigate('/pin-setup')
              onClose();
            }}>Yes</AppButton>
            <AppButton onPress={() => onClose()} variant="secondary">
              No, thanks
            </AppButton>
          </View>
        </View>
      </View>
    </AppFullScreenModal>
  );
}
