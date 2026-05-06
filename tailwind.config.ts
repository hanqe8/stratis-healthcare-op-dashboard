import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14212b",
        paper: "#f3f6f8",
        line: "#d7e0e6",
        moss: "#5c6b76",
        rust: "#b14d3a",
        gold: "#9f741f",
        teal: "#18716f",
        stratis: {
          ink: "#14212b",
          slate: "#5c6b76",
          line: "#d7e0e6",
          blue: "#18716f",
          sky: "#eff6ff",
          mint: "#ecfdf5",
          amber: "#fffbeb",
          red: "#fef2f2",
        },
      },
      boxShadow: {
        panel: "0 10px 28px rgba(20, 33, 43, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
