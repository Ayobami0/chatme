import { vars } from "nativewind";
import { AppColor } from "./color";

export const colorschemes = {
  light: vars({
    "--color-background": AppColor.white,
    "--color-foreground": AppColor.neutral900,
    "--color-surface": AppColor.white,
    "--color-primary": AppColor.primary400,
    "--color-primary-foreground": AppColor.white,
    "--color-secondary": AppColor.primary100,
    "--color-secondary-foreground": AppColor.primary800,
    "--color-muted": AppColor.neutral100,
    "--color-muted-foreground": AppColor.neutral500,
    "--color-border": AppColor.divider,
    "--color-success": AppColor.success,
    "--color-warning": AppColor.warning,
    "--color-danger": AppColor.danger,

    "--color-title": AppColor.neutral900,
    "--color-body": AppColor.neutral700,
    "--color-subtext": AppColor.neutral300,
    "--color-caption": AppColor.neutral400,
    "--color-placeholder": AppColor.neutral300,
  }),
  dark: vars({
    "--color-background": AppColor.neutral900,
    "--color-foreground": AppColor.white,

    "--color-surface": AppColor.neutral800,

    "--color-primary": AppColor.primary400,
    "--color-primary-foreground": AppColor.white,

    "--color-secondary": AppColor.primary800,
    "--color-secondary-foreground": AppColor.primary100,

    "--color-muted": AppColor.neutral800,
    "--color-muted-foreground": AppColor.neutral300,

    "--color-border": AppColor.neutral700,

    "--color-success": AppColor.success,
    "--color-warning": AppColor.warning,
    "--color-danger": AppColor.danger,

    // Text
    "--color-title": AppColor.white,
    "--color-body": AppColor.neutral100,
    "--color-subtext": AppColor.neutral300,
    "--color-caption": AppColor.neutral400,
    "--color-placeholder": AppColor.neutral500,
  }),
};
