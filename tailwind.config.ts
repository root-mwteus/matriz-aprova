import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0D0D0D",
        foreground: "#FFFFFF",
        accent: "#CBFF4D",
        "accent-foreground": "#000000",
        card: "#1A1A1A",
        "card-border": "#2A2A2A",
        muted: "#666666",
        "muted-foreground": "#666666",
        "badge-bg": "#CBFF4D20",
        "badge-border": "#CBFF4D40",
        surface: "#111111",
        destructive: "#FF4D4D",
        warning: "#F0C040",
      },
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      backgroundImage: {
        "grid-dots":
          "radial-gradient(#1E1E1E 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-dots": "24px 24px",
      },
      letterSpacing: {
        title: "0.05em",
        wide: "0.1em",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "counter": "counter 2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
