"use client"

import { useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Menu suspenso.
 *
 * Navegável por teclado (setas, Home/End, Esc), fecha ao clicar fora e
 * se reposiciona sozinho quando não cabe abaixo do gatilho — sem isso,
 * itens no rodapé de uma tabela abrem para fora da janela.
 */

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
  className?: string
  rootClassName?: string
}

export function Menu({ trigger, children, align = "end", className, rootClassName }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [flipUp, setFlipUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      const items = Array.from(
        listRef.current?.querySelectorAll<HTMLElement>("[data-menu-item]:not([disabled])") ?? []
      )
      const idx = items.indexOf(document.activeElement as HTMLElement)

      switch (e.key) {
        case "Escape":
          setOpen(false)
          ;(rootRef.current?.querySelector("[data-menu-trigger]") as HTMLElement)?.focus()
          break
        case "ArrowDown":
          e.preventDefault()
          items[Math.min(idx + 1, items.length - 1)]?.focus()
          break
        case "ArrowUp":
          e.preventDefault()
          items[Math.max(idx - 1, 0)]?.focus()
          break
        case "Home":
          e.preventDefault()
          items[0]?.focus()
          break
        case "End":
          e.preventDefault()
          items[items.length - 1]?.focus()
          break
      }
    }

    // Abre para cima quando não há espaço embaixo.
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) setFlipUp(window.innerHeight - rect.bottom < 240)

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn("relative inline-flex", rootClassName)}>
      <span
        data-menu-trigger
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        className="contents"
      >
        {trigger}
      </span>

      {open && (
        <div
          id={id}
          ref={listRef}
          role="menu"
          className={cn(
            "absolute z-40 min-w-[176px] animate-pop rounded-lg border border-line bg-surface p-1 shadow-pop",
            flipUp ? "bottom-full mb-1.5" : "top-full mt-1.5",
            align === "end" ? "right-0" : "left-0",
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  icon,
  shortcut,
  destructive,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode
  shortcut?: string
  destructive?: boolean
}) {
  return (
    <button
      data-menu-item
      role="menuitem"
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm",
        "transition-colors duration-fast",
        "focus:outline-none disabled:pointer-events-none disabled:opacity-45",
        destructive
          ? "text-negative hover:bg-negative-soft focus-visible:bg-negative-soft"
          : "text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:bg-surface-hover focus-visible:text-fg",
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-fg-faint [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="shrink-0 text-2xs text-fg-faint">{shortcut}</span>}
    </button>
  )
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-1.5 text-2xs font-medium uppercase tracking-wide text-fg-faint">{children}</div>
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-line" />
}
