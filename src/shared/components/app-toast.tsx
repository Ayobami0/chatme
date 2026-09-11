import { BlurView } from "expo-blur";
import { FC } from "react";
import { SvgProps } from "react-native-svg";
import Toast, { type ToastConfigParams } from "react-native-toast-message";
import { AppText } from "./app-text";
import { AppColor, withOpacity } from "@shared/theme/color";

export const toast = Toast;

const config = {
  native: ({ text1, props }: ToastConfigParams<{ icon?: FC<SvgProps> }>) => {
    const Icon = props.icon;
    return (
      <BlurView
        intensity={80}
        tint="dark"
        style={{
          backgroundColor: withOpacity(AppColor.neutral900, 0.72),
          gap: 8,
          borderRadius: 100,
          padding: 8,
          flexDirection: "row",
          overflow: "hidden",
          alignItems: "center",
        }}
      >
        {Icon && (
          <BlurView
            intensity={80}
            tint="dark"
            style={{
              backgroundColor: withOpacity(AppColor.neutral900, 0.3),
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center",
              width: 24,
              height: 24,
              overflow: "hidden",
            }}
          >
            <Icon color={AppColor.white} width={12} height={12} />
          </BlurView>
        )}
        <AppText style={{ color: AppColor.white }}>{text1}</AppText>
      </BlurView>
    );
  },
};

export const AppToast = () => {
  return <Toast config={config} position="top" />;
};
