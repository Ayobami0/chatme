import { AppColor, withOpacity } from "@shared/theme/color";
import { BlurView, BlurViewProps } from "expo-blur";
import { View } from "react-native";

type AppBlurViewProps = Omit<BlurViewProps, 'intensity' | 'classname'>;

export function AppBlurView(props: AppBlurViewProps) {
  return (
    <BlurView intensity={85} {...props} className="absolute inset-0">
      <View
        className="absolute inset-0"
        style={{ backgroundColor: withOpacity(AppColor.neutral900, 0.24) }}
      />
      {props.children}
    </BlurView>
  );
}
