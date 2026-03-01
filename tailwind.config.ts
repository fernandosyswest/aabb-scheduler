import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0038A9",
          "blue-dark": "#002880",
          "blue-light": "#1a4fc4",
          "blue-pale": "#e8eef8",
          yellow: "#F9DD17",
          "yellow-dark": "#d4b800",
          "yellow-pale": "#fefbe8",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        display: ["var(--font-bebas)", "Bebas Neue", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.3s ease forwards",
        "fade-in": "fadeIn 0.2s ease forwards",
        "slide-in": "slideIn 0.25s ease forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
