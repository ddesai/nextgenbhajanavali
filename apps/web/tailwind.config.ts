import typography from "@tailwindcss/typography";
import type { Config } from "tailwindcss";
import uiPreset from "@ngb/ui/tailwind.preset";

const config: Config = {
  darkMode: ["class"],
  presets: [uiPreset],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gujarati: ["var(--font-gujarati)", "var(--font-sans)", "system-ui"],
      },
    },
  },
  plugins: [typography],
};

export default config;
