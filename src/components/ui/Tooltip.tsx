"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Tooltip.
 *
 * Abre com atraso e fecha na hora: o atraso evita a "chuva" de balões ao
 * atravessar uma barra de ferramentas, e o fechamento imediato evita que
 * um balão órfão cubra o que a pessoa quer clicar.
 *
 * Aparece também no foco por teclado. Não serve para informação
 * essencial — o que só existe no hover não existe no toque.
 */

export function Tooltip({
  content,
  side = "top",
  delay = 350,
  children,
  className,
  wrapperClassName,
}: {
  content: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  delay?: number
  children: React.ReactNode
  /** Estilo do balão. */
  className?: string
  /** Estilo do elemento que envolve o gatilho — necessário quando o alvo
      precisa ocupar a largura toda (item de menu, botão em bloco). */
  wrapperClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const show = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setOpen(false)
  }

  const position = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  }[side]

  return (
    <span
      className={cn("relative inline-flex", wrapperClassName)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 w-max max-w-[220px] animate-fade-in rounded-md",
            "border border-line-strong bg-surface px-2 py-1 text-xs text-fg shadow-md",
            position,
            className
          )}
        >
          {content}
        </span>
      )}
    </span>
  )
}
