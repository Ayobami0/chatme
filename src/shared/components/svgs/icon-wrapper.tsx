import React from "react";
import { SvgProps } from "react-native-svg";
import { useThemeColor } from "@shared/hooks/use-theme-color";

export function withThemeColor<P extends SvgProps>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ThemedIcon(props: P) {
    const defaultColor = useThemeColor("foreground");
    return <Component color={props.color ?? defaultColor} {...props} />;
  };
}
