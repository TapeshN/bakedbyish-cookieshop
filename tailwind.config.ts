import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-deep": "var(--paper-deep)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        line: "var(--line)",
        caramel: "var(--caramel)",
        terracotta: "var(--terracotta)",
        chocolate: "var(--chocolate)",
        strawberry: "var(--strawberry)",
      },
      fontFamily: {
        serif: ["var(--font-caprasimo)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "-apple-system", "sans-serif"],
        hand: ["var(--font-caveat)", "Bradley Hand", "cursive"],
      },
      borderRadius: {
        sm: "12px",
        md: "14px",
        lg: "18px",
        xl: "20px",
        "2xl": "22px",
        pill: "999px",
      },
      keyframes: {
        spin: {
          to: { transform: "rotate(368deg)" },
        },
      },
      animation: {
        badge: "spin 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
