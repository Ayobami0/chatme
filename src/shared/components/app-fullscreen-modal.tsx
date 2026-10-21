import { Modal, Pressable } from "react-native";
import { AppBlurView } from "./app-blur-view";
import { ReactNode, useState } from "react";

type AppFullScreenModalProps = {
  animationType?: "slide" | "none" | "fade";
  transparent?: boolean;
  visible?: boolean;
  closeOnBackdropTap?: boolean;
  children: ReactNode
  onClose: ()=>void
};

export function AppFullScreenModal(props: AppFullScreenModalProps) {
  const {
    visible = false,
    animationType = "slide",
    transparent = false,
    closeOnBackdropTap = false,
    children,
    onClose,
  } = props;

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <AppBlurView className="flex-1">
        {closeOnBackdropTap && (
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
          />
        )}

        {children}
      </AppBlurView>
    </Modal>
  );
}
