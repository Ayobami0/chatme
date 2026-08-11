import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";

import { cn } from "@utils/ui";

const appViewVariants = cva("bg-background h-screen px-7", {
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

type AppViewProps = ViewProps &
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
    <View
      {...props}
      className={cn(
        appViewVariants({ withSafeArea }),
        className,
      )}
    >
      {children}
    </View>
  );
}
