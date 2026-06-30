"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

interface Segment {
  type: "text" | "inline" | "display"
  content: string
}

function splitLatex(text: string): Segment[] {
  const result: Segment[] = []

  // Split on $$...$$ (display math) first
  const displayParts = text.split(/(\$\$[\s\S]*?\$\$)/)

  for (const part of displayParts) {
    if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
      result.push({ type: "display", content: part.slice(2, -2) })
      continue
    }
    // Within plain-text segments, split on $...$ (inline math)
    const inlineParts = part.split(/(\$[^$\n]+?\$)/)
    for (const p of inlineParts) {
      if (!p) continue
      if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
        result.push({ type: "inline", content: p.slice(1, -1) })
      } else {
        result.push({ type: "text", content: p })
      }
    }
  }

  return result
}

function renderMath(latex: string, display: boolean): string {
  try {
    return katex.renderToString(latex, {
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
  const segments = splitLatex(text)
  const Tag = block ? "div" : "span"

  return (
    <Tag className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>
        }
        if (seg.type === "display") {
          return (
            <div
              key={i}
              className="my-3 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: renderMath(seg.content, true) }}
            />
          )
        }
        // inline
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
