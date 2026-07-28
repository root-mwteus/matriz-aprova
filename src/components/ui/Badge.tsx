"use client"

import { cn } from "@/lib/utils"

/**
 * Badge — rótulo de estado.
 *
 * Sem caixa alta e sem cor saturada: um badge deve ser lido, não
 * gritado. O ponto colorido carrega o significado; o texto carrega o
 * conteúdo. Isso mantém a cor como reforço, nunca como único portador
 * de informação (requisito de acessibilidade).
 */

type Tone = "neutral" | "accent" | "positive" | "negative" | "caution" | "info"

const tones: Record<Tone, { chip: string; dot: string }> = {
  neutral: { chip: "bg-surface-sunken text-fg-muted border-line-strong", dot: "bg-fg-faint" },
  accent: { chip: "bg-accent-soft text-accent-ink border-line-accent", dot: "bg-accent" },
  positive: { chip: "bg-positive-soft text-positive border-[color:var(--positive)]/20", dot: "bg-positive" },
  negative: { chip: "bg-negative-soft text-negative border-[color:var(--negative)]/20", dot: "bg-negative" },
  caution: { chip: "bg-caution-soft text-caution border-[color:var(--caution)]/20", dot: "bg-caution" },
  info: { chip: "bg-info-soft text-info border-[color:var(--info)]/20", dot: "bg-info" },
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  /** Exibe o ponto de estado à esquerda. */
  dot?: boolean
  size?: "sm" | "md"
}

export function Badge({ tone = "neutral", dot, size = "md", className, children, ...props }: BadgeProps) {
  const t = tones[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
        t.chip,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", t.dot)} aria-hidden />}
      {children}
    </span>
  )
}

/**
 * Estados de negócio já mapeados para tons — assim a mesma situação
 * tem sempre a mesma cor em toda a aplicação.
 */
const statusTone: Record<string, Tone> = {
  ativo: "positive",
  publicado: "positive",
  aprovado: "positive",
  concluido: "positive",
  trial: "info",
  aguardando: "caution",
  pendente: "caution",
  rascunho: "neutral",
  inativo: "neutral",
  reembolsado: "neutral",
  suspenso: "negative",
  cancelado: "negative",
  expirado: "negative",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status?.toLowerCase()
  return (
    <Badge tone={statusTone[key] ?? "neutral"} dot className={cn("capitalize", className)}>
      {status}
    </Badge>
  )
}

/** Tecla de atalho. Usada nos menus e na busca. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border border-line-strong",
        "bg-surface-sunken px-1 font-sans text-2xs font-medium text-fg-subtle",
        className
      )}
    >
      {children}
    </kbd>
  )
}
