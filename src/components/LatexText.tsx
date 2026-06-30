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

function renderMath(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode: display,
      throwOnError: false,
      strict: false,
    })
  } catch {
    return `<span class="text-red-400">${latex}</span>`
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
