import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#111726",
        "surface-card": "#161f33",
        "surface-border": "#212e4a",
        accent: {
          blue: "#3b82f6",
          purple: "#8b5cf6",
          green: "#10b981",
          amber: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
