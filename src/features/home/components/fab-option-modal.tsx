import { AppFullScreenModal, AppText } from "@components";
import {
  SolidChatSvg,
  SolidUserCircleSvg,
  SolidUserGroupSvg,
} from "@shared/components/svgs/icons";
import { FC, useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { SvgProps } from "react-native-svg";
import { FloatingActionButton } from "./fab";
import { useThemeColor } from "@shared/hooks/use-theme-color";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

type FABCloseAction = "new-chat" | "new-contact" | "new-group" | undefined;

export function FABOptionModal({
  isVisible: visible,
  onClose,
}: {
  isVisible: boolean;
  onClose: (action?: FABCloseAction) => void;
}) {
  const rotation = useSharedValue(0);

  const rotateFabStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const close = (action?: FABCloseAction) => {
    rotation.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(onClose)(action);
      }
    });
  };

  useEffect(() => {
    rotation.value = withTiming(45, { duration: 200 });
  }, []);

  return (
    <AppFullScreenModal
      visible={visible}
      onClose={close}
      transparent
      animationType="none"
      closeOnBackdropTap
    >
      <View className="absolute right-0 bottom-[100] mx-6 items-end gap-3">
        <FABOption
          label="New Chat"
          icon={SolidChatSvg}
          onPress={() => close("new-chat")}
        />
        <FABOption
          label="New Contact"
          icon={SolidUserCircleSvg}
          onPress={() => close("new-contact")}
        />
        <FABOption
          label="New Group"
          icon={SolidUserGroupSvg}
          onPress={() => close("new-group")}
        />
        <FloatingActionButton onPress={() => close()} style={rotateFabStyle} />
      </View>
    </AppFullScreenModal>
  );
}

function FABOption({
  icon,
  label,
  onPress,
}: {
  icon: FC<SvgProps>;
  label: string;
  onPress: () => void;
}) {
  const Icon = icon;
  const primaryColor = useThemeColor("primary");
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="flex-row bg-surface p-4 gap-[10] items-center rounded-full"
      style={{
        shadowColor: "#0C291D",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.02,
        shadowRadius: 16,
        elevation: 2,
      }}
    >
      <Icon color={primaryColor} />
      <AppText variant="h6">{label}</AppText>
    </TouchableOpacity>
  );
}
