import type { Config } from "tailwindcss"

/**
 * Os tokens vivem em globals.css como custom properties.
 * O Tailwind apenas os expõe — assim tema claro/escuro e
 * qualquer ajuste futuro acontecem num lugar só.
 */
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
        /* ── Superfícies ───────────────────────────────── */
        canvas: "var(--canvas)",
        surface: {
          DEFAULT: "var(--surface)",
          sunken: "var(--surface-sunken)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        line: {
          DEFAULT: "var(--line)",
          strong: "var(--line-strong)",
          accent: "var(--line-accent)",
        },

        /* ── Texto (4 níveis de hierarquia) ────────────── */
        fg: {
          DEFAULT: "var(--text)",
          muted: "var(--text-2)",
          subtle: "var(--text-3)",
          faint: "var(--text-4)",
          "on-accent": "var(--text-on-accent)",
          "on-solid": "var(--text-on-solid)",
        },

        /* ── Acento e primário ─────────────────────────── */
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          ink: "var(--accent-ink)",
          soft: "var(--accent-soft)",
        },
        solid: {
          DEFAULT: "var(--solid)",
          hover: "var(--solid-hover)",
        },

        /* ── Semânticos ────────────────────────────────── */
        positive: { DEFAULT: "var(--positive)", soft: "var(--positive-soft)" },
        negative: { DEFAULT: "var(--negative)", soft: "var(--negative-soft)" },
        caution: { DEFAULT: "var(--caution)", soft: "var(--caution-soft)" },
        info: { DEFAULT: "var(--info)", soft: "var(--info-soft)" },

        /* ── Aliases legados: mapeados para os tokens novos
              para que telas ainda não migradas herdem o tema ── */
        background: "var(--canvas)",
        foreground: "var(--text)",
        card: "var(--surface)",
        "card-border": "var(--line)",
        muted: "var(--text-3)",
        "muted-foreground": "var(--text-3)",
        "accent-foreground": "var(--text-on-accent)",
        destructive: "var(--negative)",
        warning: "var(--caution)",

        /* ── Marketing (escopo próprio, intocado) ──────── */
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
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },

      /* Escala tipográfica: tracking óptico embutido — quanto maior
         o corpo, mais fechado o espacejamento. Os tamanhos grandes
         seguem os do Tailwind para não deslocar o marketing; a faixa
         densa (2xs–base) é calibrada para a aplicação. */
      fontSize: {
        "2xs": ["10.5px", { lineHeight: "14px", letterSpacing: "0.04em" }],
        xs: ["11.5px", { lineHeight: "16px", letterSpacing: "0.01em" }],
        sm: ["13px", { lineHeight: "18px", letterSpacing: "0" }],
        base: ["15px", { lineHeight: "22px", letterSpacing: "-0.009em" }],
        md: ["16px", { lineHeight: "24px", letterSpacing: "-0.011em" }],
        lg: ["18px", { lineHeight: "26px", letterSpacing: "-0.016em" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "-0.021em" }],
        "2xl": ["24px", { lineHeight: "31px", letterSpacing: "-0.024em" }],
        "3xl": ["30px", { lineHeight: "37px", letterSpacing: "-0.028em" }],
        "4xl": ["36px", { lineHeight: "42px", letterSpacing: "-0.032em" }],
        "5xl": ["48px", { lineHeight: "52px", letterSpacing: "-0.034em" }],
      },

      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "560",
        bold: "640",
      },

      /* Raios: 4 passos. Nada arredondado demais. */
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        card: "10px",
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        pop: "var(--shadow-pop)",
        focus: "0 0 0 3px var(--accent-soft)",
        none: "none",
      },

      /* Trilhos de largura fixa usados pelo shell */
      spacing: {
        sidebar: "232px",
        topbar: "52px",
      },

      maxWidth: {
        content: "1120px",
        prose: "68ch",
      },

      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.2, 0, 0.13, 1)",
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.4, 0.64, 1)",
      },

      transitionDuration: {
        DEFAULT: "140ms",
        fast: "90ms",
        slow: "240ms",
      },

      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        rise: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          from: { opacity: "0", transform: "translateY(-2px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },

      animation: {
        "fade-in": "fade-in 160ms cubic-bezier(0.2, 0, 0.13, 1) both",
        rise: "rise 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
        pop: "pop 140ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
}

export default config
