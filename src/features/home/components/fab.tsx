import { SolidPlusSvg } from "@shared/components/svgs/icons";
import { AppColor } from "@shared/theme/color";
import { cn } from "@shared/utils/ui";
import { StyleSheet, TouchableOpacity, ViewProps } from "react-native";
import Animated from "react-native-reanimated";

type FloatingActionButtonProps = {
  onPress: () => void;
  className?: string;
} & ViewProps;

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#0C291D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
});

export function FloatingActionButton({
  onPress,
  style,
  className,
  ...rest
}: FloatingActionButtonProps) {
  return (
    <Animated.View
      {...rest}
      className={cn("size-16 rounded-full bg-primary-400", className)}
      style={[styles.shadow, style]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="flex-1 items-center justify-center"
      >
        <SolidPlusSvg color={AppColor.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}
