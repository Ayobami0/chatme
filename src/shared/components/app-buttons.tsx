import { cva, type VariantProps } from "class-variance-authority";
import {
  ActivityIndicator,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { cn } from "@utils/ui";
import { AppText } from "./app-text";

const appButtonVariants = cva(
  "flex-row items-center justify-center rounded-lg py-5 rounded-2xl",
  {
    variants: {
      variant: {
        primary: "bg-primary",
        secondary: "bg-primary-50",
        tertiary: "bg-transparent",
      },

      disabled: {
        true: "opacity-50",
        false: "",
      },
    },

    defaultVariants: {
      variant: "primary",
      disabled: false,
    },
  },
);

const appButtonTextVariants = cva(
  "font-medium",
  {
    variants: {
      variant: {
        primary: "text-primary-foreground",
        secondary: "text-primary",
        tertiary: "text-primary",
      },

    },

    defaultVariants: {
      variant: "primary",
    },
  },
);

type AppButtonProps = TouchableOpacityProps &
  VariantProps<typeof appButtonVariants> & {
    isLoading?: boolean;
    icon?: React.ReactNode;
  };

export function AppButton({
  children,
  variant,
  disabled,
  isLoading,
  icon,
  className,
  ...props
}: AppButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...props}
      disabled={disabled || isLoading}
      className={cn(
        appButtonVariants({
          variant,
          disabled,
        }),
        className,
      )}
    >
      {isLoading ? (
        <ActivityIndicator className="text-primary-foreground" />
      ) : (
        <>
          {icon}

          <AppText
            className={cn(
              appButtonTextVariants({
                variant,
              }),
            )}
          >
            {children as React.ReactNode}
          </AppText>
        </>
      )}
    </TouchableOpacity>
  );
}
