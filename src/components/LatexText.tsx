"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

interface Segment {
  type: "text" | "inline" | "display"
  content: string
}

// Reconhece os 4 delimitadores comuns de LaTeX:
//   display:  $$...$$   e   \[...\]
//   inline:   $...$     e   \(...\)
// Display vem antes na alternância para ter prioridade sobre inline.
const LATEX_PATTERN =
  /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g

function splitLatex(text: string): Segment[] {
  const segments: Segment[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null

  LATEX_PATTERN.lastIndex = 0
  while ((m = LATEX_PATTERN.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, m.index) })
    }
    const tok = m[0]
    if (tok.startsWith("$$")) {
      segments.push({ type: "display", content: tok.slice(2, -2) })
    } else if (tok.startsWith("\\[")) {
      segments.push({ type: "display", content: tok.slice(2, -2) })
    } else if (tok.startsWith("\\(")) {
      segments.push({ type: "inline", content: tok.slice(2, -2) })
    } else {
      segments.push({ type: "inline", content: tok.slice(1, -1) })
    }
    lastIndex = LATEX_PATTERN.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) })
  }

  return segments
}

// Converte os símbolos LaTeX mais comuns para Unicode legível,
// usado como fallback quando o KaTeX não consegue renderizar.
// Processa \sqrt antes de \frac para que \frac{\sqrt{2}}{2} → (√(2))/(2).
function latexToReadable(latex: string): string {
  return latex
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\sqrt\b/g, "√")
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mp\b/g, "∓")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\leq\b/g, "≤")
    .replace(/\\geq\b/g, "≥")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\pi\b/g, "π")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\nu\b/g, "ν")
    .replace(/\\xi\b/g, "ξ")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\phi\b/g, "φ")
    .replace(/\\psi\b/g, "ψ")
    .replace(/\\omega\b/g, "ω")
    .replace(/\\[a-zA-Z]+\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .trim()
}

function renderMath(latex: string, display: boolean): string {
  const trimmed = latex.trim()
  try {
    const html = katex.renderToString(trimmed, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    })
    // Se o KaTeX gerou elementos de erro (comandos inválidos), faz fallback legível.
    if (html.includes("katex-error")) {
      const readable = latexToReadable(trimmed)
      const escaped = readable.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      const style = display
        ? "display:block;text-align:center;margin:0.5em 0;font-style:italic"
        : "font-style:italic"
      return `<span style="${style}">${escaped || trimmed}</span>`
    }
    return html
  } catch {
    const readable = latexToReadable(trimmed)
    const escaped = readable.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return `<span style="font-style:italic">${escaped || trimmed}</span>`
  }
}

interface Props {
  text: string
  className?: string
  block?: boolean
}

export function LatexText({ text, className, block }: Props) {
  const segments = splitLatex(text || "")
  const Tag = block ? "div" : "span"

  return (
    <Tag className={className} style={{ whiteSpace: "pre-wrap" }}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>
        }
        if (seg.type === "display") {
          return (
            <span
              key={i}
              className="block my-3 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: renderMath(seg.content, true) }}
            />
          )
        }
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderMath(seg.content, false) }}
          />
        )
      })}
    </Tag>
  )
}
