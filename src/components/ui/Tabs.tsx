"use client"

import { cn } from "@/lib/utils"

/**
 * Dois padrões de troca de vista, com papéis distintos:
 *
 * Tabs      → navegação entre seções de conteúdo. Sublinhado, alinhado
 *             à esquerda, acompanha a leitura.
 * Segmented → filtro sobre o mesmo conteúdo (período, ordenação).
 *             Compacto, encaixado, cabe ao lado de um título.
 *
 * Usar o componente certo poupa uma legenda: a forma já diz se o clique
 * troca a página ou apenas recorta os dados.
 */

export interface TabItem<T extends string = string> {
  value: T
  label: string
  count?: number
  disabled?: boolean
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 border-b border-line", className)}>
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative -mb-px flex items-center gap-1.5 whitespace-nowrap px-2.5 pb-2.5 pt-1.5",
              "text-sm font-medium transition-colors duration-fast",
              "disabled:pointer-events-none disabled:opacity-45",
              active ? "text-fg" : "text-fg-subtle hover:text-fg-muted"
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-2xs tabular-nums transition-colors duration-fast",
                  active ? "bg-accent-soft text-accent-ink" : "bg-surface-sunken text-fg-subtle"
                )}
              >
                {item.count}
              </span>
            )}
            {/* O indicador é um filete de 2px encostado na borda inferior —
                o mesmo pixel que separa a aba do conteúdo. */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-opacity duration-DEFAULT",
                active ? "bg-accent opacity-100" : "opacity-0"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  size = "md",
  className,
}: {
  items: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  size?: "sm" | "md"
  className?: string
}) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-sunken p-0.5",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-[6px] font-medium transition-[background-color,color,box-shadow] duration-fast",
              size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
              active
                ? "bg-surface text-fg shadow-xs"
                : "text-fg-subtle hover:text-fg-muted"
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
