import {
  SolidCheveronLeftSvg,
  SolidSearchSvg,
  SolidQrcodeSvg,
} from "@shared/components/svgs/icons";
import { TouchableOpacity, View } from "react-native";
import { router, useRouter } from "expo-router";
import { SvgProps } from "react-native-svg";
import { FC } from "react";
import { useThemeColor } from "@shared/hooks";
import { BlurView } from "expo-blur";

export function ChatInfoNavHeader() {
  return (
    <View className="flex-row gap-3 pt-safe absolute z-10 mx-4 my-1">
      <View className="flex-1 items-start">
        <ChatInfoIcon
          icon={SolidCheveronLeftSvg}
          onPress={() => router.back()}
        />
      </View>
      <ChatInfoIcon icon={SolidSearchSvg} />
      <ChatInfoIcon icon={SolidQrcodeSvg} />
    </View>
  );
}

export function ChatInfoIcon({
  icon,
  onPress,
}: {
  icon: FC<SvgProps>;
  onPress?: () => void;
}) {
  const iconColor = useThemeColor("primary-foreground");
  const Component = icon;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <BlurView
        className="items-center justify-center size-10 rounded-full overflow-hidden"
        tint="dark"
        intensity={85}
      >
        <Component width={24} height={24} color={iconColor} />
      </BlurView>
    </TouchableOpacity>
  );
}
