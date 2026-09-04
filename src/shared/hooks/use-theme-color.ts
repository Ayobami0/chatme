import { useColorScheme } from "nativewind";
import { AppColor } from "@shared/theme/color";

export type SemanticColorKey =
  | "background"
  | "foreground"
  | "surface"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "muted"
  | "muted-foreground"
  | "border"
  | "divider"
  | "success"
  | "warning"
  | "danger"
  | "title"
  | "body"
  | "subtext"
  | "caption"
  | "placeholder"
  | "focus"
  | "focus-background"
  | "input"
  | "ring"
  | "overlay";

const semanticColorMap: Record<"light" | "dark", Record<SemanticColorKey, string>> = {
  light: {
    background: AppColor.white,
    foreground: AppColor.neutral900,
    surface: AppColor.white,
    primary: AppColor.primary400,
    "primary-foreground": AppColor.white,
    secondary: AppColor.primary100,
    "secondary-foreground": AppColor.primary800,
    muted: AppColor.divider,
    "muted-foreground": AppColor.neutral300,
    border: AppColor.neutral300,
    divider: AppColor.divider,
    success: AppColor.success,
    warning: AppColor.warning,
    danger: AppColor.danger,
    title: AppColor.neutral900,
    body: AppColor.neutral700,
    subtext: AppColor.neutral300,
    caption: AppColor.neutral400,
    placeholder: AppColor.neutral300,
    focus: AppColor.primary400,
    "focus-background": AppColor.primary50,
    input: AppColor.white,
    ring: AppColor.primary400,
    overlay: AppColor.overlay,
  },
  dark: {
    background: AppColor.neutral900,
    foreground: AppColor.white,
    surface: AppColor.neutral800,
    primary: AppColor.primary400,
    "primary-foreground": AppColor.white,
    secondary: AppColor.primary800,
    "secondary-foreground": AppColor.primary100,
    muted: AppColor.neutral700,
    "muted-foreground": AppColor.neutral200,
    border: AppColor.neutral700,
    divider: AppColor.neutral700,
    success: AppColor.success,
    warning: AppColor.warning,
    danger: AppColor.danger,
    title: AppColor.white,
    body: AppColor.neutral100,
    subtext: AppColor.neutral300,
    caption: AppColor.neutral400,
    placeholder: AppColor.neutral500,
    focus: AppColor.primary400,
    "focus-background": AppColor.neutral800,
    input: AppColor.neutral800,
    ring: AppColor.primary400,
    overlay: AppColor.overlay,
  },
};

export function useThemeColor(key: SemanticColorKey): string {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  return semanticColorMap[scheme][key];
}
