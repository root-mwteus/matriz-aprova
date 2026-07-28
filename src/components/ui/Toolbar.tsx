"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

/**
 * Barra de filtros.
 *
 * Questões e Materiais mantinham cada um a própria barra, com quatro
 * `select` estilizados à mão em cada arquivo — oito cópias da mesma
 * regra de foco e de borda. Agora é um componente só.
 *
 * Decisões de uso:
 * · sem botão "Filtrar" — o filtro é aplicado ao escolher. Um botão de
 *   confirmação aqui só adiciona um clique e a dúvida se já valeu;
 * · "Limpar" aparece apenas quando há algo a limpar, e some depois —
 *   um botão permanentemente inerte ensina a ignorar aquele canto;
 * · a barra não é um painel: é uma faixa sobre o canvas, para não
 *   parecer conteúdo.
 */

export function Toolbar({
  children,
  onClear,
  hasFilters,
  trailing,
  className,
}: {
  children: React.ReactNode
  onClear?: () => void
  hasFilters?: boolean
  /** Conteúdo alinhado à direita (contagem de resultados, ordenação). */
  trailing?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}

      {onClear && hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-fg-subtle">
          <X size={13} strokeWidth={2} />
          Limpar
        </Button>
      )}

      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  )
}

/**
 * Select compacto de filtro.
 *
 * Quando nada está escolhido mostra o nome do filtro ("Banca") em cinza;
 * escolhido, mostra o valor com a borda destacada. Assim dá para ver
 * quais filtros estão ativos sem ler cada campo.
 */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: (string | { value: string; label: string })[]
  className?: string
}) {
  const active = value !== ""

  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "field h-8 w-auto min-w-[124px] max-w-[190px] cursor-pointer text-sm",
        active ? "border-line-accent text-fg" : "text-fg-subtle",
        className
      )}
    >
      <option value="">{label}</option>
      {options.map((opt) => {
        const o = typeof opt === "string" ? { value: opt, label: opt } : opt
        return (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      })}
    </select>
  )
}
