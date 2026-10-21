import { cva, type VariantProps } from "class-variance-authority";
import { Text, type TextProps } from "react-native";

import { cn } from "@utils/ui";

const appTextVariants = cva("", {
  variants: {
    variant: {
      h1: "text-[32px] font-sf-bold",
      h2: "text-[28px] font-sf-bold",
      h3: "text-[24px] font-sf-bold",
      h4: "text-[20px] font-sf-bold",
      h5: "text-[16px] font-sf-bold",
      h6: "text-[14px] font-sf-bold",

      "body-lg-semibold": "text-[18px] font-sf-semibold",
      "body-lg-medium": "text-[16px] font-sf-medium",
      "body-lg-regular": "text-[16px] font-sf-regular",

      "body-md-semibold": "text-[14px] font-sf-semibold",
      "body-md-medium": "text-[14px] font-sf-medium",
      "body-md-regular": "text-[14px] font-sf-regular",

      "body-sm-semibold": "text-[12px] font-sf-semibold",
      "body-sm-medium": "text-[12px] font-sf-medium",
      "body-sm-regular": "text-[12px] font-sf-regular",

      "button-lg": "text-[14px] font-sf-bold",
      "button-sm": "text-[12px] font-sf-bold",
    },

    color: {
      default: "text-body",
      title: "text-title",
      body: "text-body",
      subtext: "text-subtext",
      caption: "text-caption",
      placeholder: "text-placeholder",

      primary: "text-primary",
      onPrimary: "text-primary-foreground",
      muted: "text-muted-foreground",

      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
    },
  },

  defaultVariants: {
    variant: "body-md-regular",
    color: "default",
  },
});

export type AppTextProps = TextProps &
  VariantProps<typeof appTextVariants> & {
    size?: number;
  };

export function AppText({
  children,
  variant,
  color,
  size,
  className,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      className={cn(
        appTextVariants({
          variant,
          color,
        }),
        className,
      )}
      style={[
        style,
        size !== undefined && {
          fontSize: size,
        },
      ]}
    >
      {children}
    </Text>
  );
}
