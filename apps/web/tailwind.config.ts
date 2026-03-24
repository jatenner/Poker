import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        felt: {
          50: "#e8f5e9",
          100: "#c8e6c9",
          200: "#a5d6a7",
          300: "#81c784",
          400: "#66bb6a",
          500: "#2e7d32",
          600: "#256427",
          700: "#1b5e20",
          800: "#144d19",
          900: "#0a3a10",
          950: "#042b08",
        },
        card: {
          white: "#f8f9fa",
          cream: "#f5f0e8",
        },
        chip: {
          red: "#d32f2f",
          blue: "#1565c0",
          green: "#2e7d32",
          black: "#212121",
          white: "#f5f5f5",
          gold: "#f9a825",
        },
        table: {
          border: "#5d4037",
          rail: "#4e342e",
          surface: "#1b5e20",
        },
        suit: {
          hearts: "#ef4444",
          diamonds: "#3b82f6",
          clubs: "#1e293b",
          spades: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "felt-texture":
          "radial-gradient(ellipse at center, #1b5e20 0%, #0a3a10 100%)",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.3)",
        chip: "0 3px 6px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
