"use client"

import { cn } from "@/lib/utils"

/**
 * Estados de carregamento, vazio e erro.
 *
 * Toda lista da aplicação passa por estes três — tratá-los num só lugar
 * garante que nenhuma tela caia num "Carregando..." solto no canto.
 */

/* ── Skeleton ────────────────────────────────────────────────────── */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton h-4 w-full", className)} {...props} />
}

/**
 * Skeleton de texto com larguras irregulares — blocos de larguras iguais
 * denunciam o carregador; texto real nunca é retangular.
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["100%", "92%", "78%", "85%", "64%"]
  return (
    <div className={cn("space-y-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  )
}

export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={cn("animate-spin text-fg-faint", className)}
      role="status"
      aria-label="Carregando"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Vazio ───────────────────────────────────────────────────────── */

/**
 * Estado vazio. O título diz o que aconteceu, a ação diz o que fazer
 * a seguir — um estado vazio sem saída é um beco.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-sunken text-fg-faint">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-fg-subtle">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* ── Erro ────────────────────────────────────────────────────────── */

export function ErrorState({
  title = "Não foi possível carregar",
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}
    >
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--negative)]/20 bg-negative-soft text-negative">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 8v5M12 16.5v.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-fg-subtle">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md px-2.5 py-1.5 text-sm font-medium text-accent-ink transition-colors duration-fast hover:bg-accent-soft"
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
