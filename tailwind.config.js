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
      },
    },
  },
  plugins: [],
};
