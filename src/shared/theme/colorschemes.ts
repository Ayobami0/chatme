import { vars } from "nativewind";
import { AppColor } from "./color";

const sharedScaleVars = {
  "--color-primary-50": AppColor.primary50,
  "--color-primary-100": AppColor.primary100,
  "--color-primary-200": AppColor.primary200,
  "--color-primary-300": AppColor.primary300,
  "--color-primary-400": AppColor.primary400,
  "--color-primary-500": AppColor.primary500,
  "--color-primary-600": AppColor.primary600,
  "--color-primary-700": AppColor.primary700,
  "--color-primary-800": AppColor.primary800,
  "--color-primary-900": AppColor.primary900,

  "--color-neutral-50": AppColor.neutral50,
  "--color-neutral-100": AppColor.neutral100,
  "--color-neutral-200": AppColor.neutral200,
  "--color-neutral-300": AppColor.neutral300,
  "--color-neutral-400": AppColor.neutral400,
  "--color-neutral-500": AppColor.neutral500,
  "--color-neutral-600": AppColor.neutral600,
  "--color-neutral-700": AppColor.neutral700,
  "--color-neutral-800": AppColor.neutral800,
  "--color-neutral-900": AppColor.neutral900,
};

export const colorschemes = {
  light: vars({
    ...sharedScaleVars,
    "--color-background": AppColor.white,
    "--color-foreground": AppColor.neutral900,
    "--color-surface": AppColor.white,
    "--color-primary": AppColor.primary400,
    "--color-primary-foreground": AppColor.white,
    "--color-secondary": AppColor.primary100,
    "--color-secondary-foreground": AppColor.primary800,

    "--color-muted": AppColor.divider,
    "--color-muted-foreground": AppColor.neutral300,
    "--color-border": AppColor.neutral300,
    "--color-divider": AppColor.divider,

    "--color-success": AppColor.success,
    "--color-success-foreground": AppColor.white,
    "--color-warning": AppColor.warning,
    "--color-warning-foreground": AppColor.neutral900,
    "--color-danger": AppColor.danger,
    "--color-danger-foreground": AppColor.white,

    "--color-title": AppColor.neutral900,
    "--color-body": AppColor.neutral700,
    "--color-subtext": AppColor.neutral300,
    "--color-caption": AppColor.neutral400,
    "--color-placeholder": AppColor.neutral300,

    "--color-focus": AppColor.primary400,
    "--color-focus-background": AppColor.primary50,
    "--color-input": AppColor.white,
    "--color-ring": AppColor.primary400,
    "--color-overlay": AppColor.overlay,
  }),
  dark: vars({
    ...sharedScaleVars,
    "--color-background": AppColor.neutral900,
    "--color-foreground": AppColor.white,
    "--color-surface": AppColor.neutral800,
    "--color-primary": AppColor.primary400,
    "--color-primary-foreground": AppColor.white,
    "--color-secondary": AppColor.primary800,
    "--color-secondary-foreground": AppColor.primary100,

    "--color-muted": AppColor.neutral700,
    "--color-muted-foreground": AppColor.neutral200,
    "--color-border": AppColor.neutral700,
    "--color-divider": AppColor.neutral700,

    "--color-success": AppColor.success,
    "--color-success-foreground": AppColor.white,
    "--color-warning": AppColor.warning,
    "--color-warning-foreground": AppColor.neutral900,
    "--color-danger": AppColor.danger,
    "--color-danger-foreground": AppColor.white,

    "--color-title": AppColor.white,
    "--color-body": AppColor.neutral100,
    "--color-subtext": AppColor.neutral300,
    "--color-caption": AppColor.neutral400,
    "--color-placeholder": AppColor.neutral500,

    "--color-focus": AppColor.primary400,
    "--color-focus-background": AppColor.neutral800,
    "--color-input": AppColor.neutral800,
    "--color-ring": AppColor.primary400,
    "--color-overlay": AppColor.overlay,
  }),
};
