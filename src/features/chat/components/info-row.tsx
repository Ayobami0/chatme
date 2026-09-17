import { AppText } from "@components";
import { useThemeColor } from "@shared/hooks";
import { AppColor } from "@shared/theme/color";
import { useColorScheme } from "nativewind";
import { FC } from "react";
import { Pressable, View } from "react-native";
import { SvgProps } from "react-native-svg";

export function Row({
  icon,
  label,
  onGo,
  surfixIcon,
  textColor,
  iconColor,
}: {
  icon: FC<SvgProps>;
  label: string;
  onGo?: () => void;
  surfixIcon?: React.ReactNode;
  textColor?: string;
  iconColor?: string;
}) {
  const Icon = icon;
  const SurfixIcon = surfixIcon;
  const { colorScheme } = useColorScheme();
  const resolvedIconColor = iconColor ?? useThemeColor("primary");
  const resolvedTextColor =
    textColor ??
    (colorScheme === "dark" ? AppColor.whiteOther : AppColor.neutral600);

  return (
    <Pressable className="flex flex-row py-3 items-center gap-3" onPress={onGo}>
      <Icon height={24} width={24} color={resolvedIconColor} />
      <AppText variant="body-lg-medium" style={{ color: resolvedTextColor }}>
        {label}
      </AppText>

      <View className="flex-1 flex-row justify-end">
        {SurfixIcon && SurfixIcon}
      </View>
    </Pressable>
  );
}
