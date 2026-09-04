import { cva, type VariantProps } from "class-variance-authority";
import { KeyboardAvoidingView, KeyboardAvoidingViewProps, View, type ViewProps } from "react-native";

import { cn } from "@utils/ui";

const appViewVariants = cva("bg-background flex-1 px-7", {
  variants: {
    withSafeArea: {
      true: "pt-safe pb-safe",
      false: "",
    },
  },
  defaultVariants: {
    withSafeArea: false,
  },
});

type AppViewProps = KeyboardAvoidingViewProps &
  VariantProps<typeof appViewVariants> & {
    children: React.ReactNode;
  };

export function AppView({
  children,
  className,
  withSafeArea,
  ...props
}: AppViewProps) {
  return (
    <KeyboardAvoidingView
        {...props}
        className={cn(
          appViewVariants({ withSafeArea }),
          className,
        )}
      >
        {children}
    </KeyboardAvoidingView>
  );
}
