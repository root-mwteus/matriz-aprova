"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Search, CornerDownLeft, Lock } from "lucide-react"
import { navItems } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui"

/**
 * Paleta de comandos (⌘K).
 *
 * Existe porque a navegação por sidebar custa dois movimentos — mirar e
 * clicar — e quem usa o produto todo dia sabe para onde quer ir antes de
 * olhar. Aqui a rota é alcançada por três teclas.
 *
 * Regras que fazem a diferença no uso real:
 * · a primeira opção já vem selecionada, então Enter sempre funciona;
 * · o filtro ignora acentos ("estatisticas" acha "Estatísticas");
 * · a lista fecha ao navegar e reabre limpa.
 */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = normalize(query.trim())
    const available = navItems.filter((i) => !i.soon)
    if (!q) return available
    return available.filter((i) => normalize(i.label).includes(q) || normalize(i.href).includes(q))
  }, [query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    setQuery("")

    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, results.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setCursor((c) => Math.max(c - 1, 0))
      } else if (e.key === "Enter") {
        const target = results[cursor]
        if (target) {
          e.preventDefault()
          router.push(target.href)
          onClose()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = overflow
    }
  }, [open, results, cursor, router, onClose])

  // Mantém a opção destacada visível ao percorrer com o teclado.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-[color:var(--overlay)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscar e navegar"
        className="relative w-full max-w-[520px] animate-pop overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search size={15} strokeWidth={2} className="shrink-0 text-fg-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir para…"
            aria-label="Buscar página"
            className="h-11 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-faint"
          />
          <Kbd>esc</Kbd>
        </div>

        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-fg-subtle">
              Nada encontrado para “{query}”
            </p>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon
              const active = i === cursor
              return (
                <button
                  key={item.href}
                  data-active={active}
                  onPointerMove={() => setCursor(i)}
                  onClick={() => {
                    router.push(item.href)
                    onClose()
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm",
                    "transition-colors duration-fast",
                    active ? "bg-surface-active text-fg" : "text-fg-muted"
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} className={active ? "text-accent-ink" : "text-fg-faint"} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.soon ? (
                    <Lock size={11} className="text-fg-faint" />
                  ) : (
                    active && <CornerDownLeft size={12} className="text-fg-faint" />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Registra o atalho global ⌘K / Ctrl+K. */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return { open, setOpen }
}
