export function withOpacity(color: string, opacity: number): string {
  const clamped = Math.min(1, Math.max(0, opacity));

  const alpha = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();

  return `${color}${alpha}`;
}

export const AppColor = {
  primary50: "#F5FBF7",
  primary100: "#E8F5ED",
  primary200: "#ABDBBE",
  primary300: "#73C393",
  primary400: "#57B77D",
  primary500: "#499968",
  primary600: "#3A7A53",
  primary700: "#2B5C3F",
  primary800: "#1D3D2A",
  primary900: "#112519",

  neutral50: "#DDE2E8",
  neutral100: "#B3C2CE",
  neutral200: "#8EA3B3",
  neutral300: "#6E8597",
  neutral400: "#4B667A",
  neutral500: "#3A566A",
  neutral600: "#1F3C51",
  neutral700: "#163043",
  neutral800: "#0F2637",
  neutral900: "#081C2C",

  red100: "#FFF5F5",
  red200: "#F7C5BD",
  red300: "#F4A79D",
  red400: "#FA6B52",
  red500: "#E8503A",

  blue100: "#ECF5FF",
  blue200: "#AAD3FF",
  blue300: "#80BDFF",
  blue400: "#55A8FF",
  blue500: "#007CFF",

  orange100: "#FFF0D9",
  orange200: "#FFE5BF",
  orange300: "#FFD89F",
  orange400: "#FFCC7F",
  orange500: "#FFB23F",

  white: "#FFFFFF",
  white90: "#FFFFFFE5",
  whiteOther: "#F1F7FA",
  bgSecondary: "#F1F7FA",

  overlay: "rgba(0, 0, 0, 0.50)",

  success: "#57B77D",
  warning: "#E8A13A",
  danger: "#DD524C",

  divider: "#EAEEF2",
  bgLight: "#F5F7F9",
} as const;
