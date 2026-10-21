module.exports = {
  content: [
    "./src/app/**/*.{js,ts,tsx}",
    "./src/features/**/*.{js,ts,tsx}",
    "./src/shared/components/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "sf-regular": ["SFProDisplay-Regular"],
        "sf-medium": ["SFProDisplay-Medium"],
        "sf-semibold": ["SFProDisplay-SemiBold"],
        "sf-bold": ["SFProDisplay-Bold"],
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        surface: {
          DEFAULT: "var(--color-surface)",
        },

        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",

          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },

        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },

        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },

        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },

        border: "var(--color-border)",

        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",

        title: "var(--color-title)",
        body: "var(--color-body)",
        subtext: "var(--color-subtext)",
        caption: "var(--color-caption)",
        placeholder: "var(--color-placeholder)",

        divider: "var(--color-divider)",

        focus: "var(--color-focus)",
        "focus-background": "var(--color-focus-background)",
      },
    },
  },
  plugins: [],
};
