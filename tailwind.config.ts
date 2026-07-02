import type { Config } from "tailwindcss"

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
        // ── Dashboard (legacy) ──
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
        // ── Marketing ──
        ink: "#0E1117",
        "ink-2": "#171B23",
        "ink-3": "#222731",
        "ink-4": "#2D333F",
        paper: "#F4F1EA",
        "paper-2": "#EAE4D6",
        "paper-3": "#DDD5C2",
        lime: "#C8FF3D",
        "lime-dark": "#9FD41C",
        "area-concursos": "#FFD500",
        "area-oab": "#E63946",
        "area-militar": "#3D8B3D",
        "area-enem": "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      backgroundImage: {
        "grid-dots": "radial-gradient(#1E1E1E 1px, transparent 1px)",
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
