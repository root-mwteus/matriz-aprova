"use client"

import { cn } from "@/lib/utils"

/**
 * Métricas.
 *
 * A leitura de um número segue sempre a mesma ordem: rótulo pequeno,
 * valor grande, variação discreta. Inverter essa ordem — valor primeiro,
 * rótulo depois — força o olho a voltar atrás para saber o que leu.
 *
 * A variação usa seta + cor. A seta sozinha já resolve para quem não
 * distingue as cores.
 */

export function Stat({
  label,
  value,
  delta,
  deltaLabel,
  hint,
  className,
}: {
  label: string
  value: React.ReactNode
  /** Positivo sobe, negativo desce. Formatado como percentual. */
  delta?: number | null
  deltaLabel?: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-xs font-medium text-fg-subtle">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-fg">{value}</p>
      {(delta != null || hint) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {delta != null && <Delta value={delta} />}
          {(deltaLabel || hint) && (
            <span className="truncate text-xs text-fg-subtle">{deltaLabel || hint}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        up ? "text-positive" : "text-negative",
        className
      )}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path
          d={up ? "M5 8V2M5 2L2 5M5 2l3 3" : "M5 2v6M5 8l-3-3M5 8l3-3"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {Math.abs(value)}%<span className="sr-only">{up ? " de alta" : " de queda"}</span>
    </span>
  )
}

/**
 * Barra de progresso.
 *
 * Trilho fino e cantos arredondados no preenchimento — uma barra grossa
 * compete com o número que ela deveria apenas ilustrar.
 */
export function Progress({
  value,
  max = 100,
  tone = "accent",
  size = "md",
  label,
  className,
}: {
  value: number
  max?: number
  tone?: "accent" | "positive" | "negative" | "caution" | "neutral"
  size?: "sm" | "md"
  label?: string
  className?: string
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  const fill = {
    accent: "bg-accent",
    positive: "bg-positive",
    negative: "bg-negative",
    caution: "bg-caution",
    neutral: "bg-fg-faint",
  }[tone]

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-sunken",
        size === "sm" ? "h-1" : "h-1.5",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-slow ease-out", fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Anel de progresso — para percentuais isolados, onde a barra pediria
 * uma largura que a grade não tem.
 */
export function ProgressRing({
  value,
  size = 44,
  stroke = 4,
  className,
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-[stroke-dashoffset] duration-slow ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold tabular-nums text-fg">
        {children ?? `${Math.round(pct)}%`}
      </div>
    </div>
  )
}

/* ── Avatar ──────────────────────────────────────────────────────── */

export function Avatar({
  name,
  src,
  size = 28,
  className,
}: {
  name?: string | null
  src?: string | null
  size?: number
  className?: string
}) {
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—"

  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        "border border-line bg-surface-sunken font-medium text-fg-muted",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
      aria-hidden={!name}
      title={name || undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || ""} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
