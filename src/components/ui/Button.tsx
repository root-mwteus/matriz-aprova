"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * Botão.
 *
 * Cinco variantes, cada uma com um papel definido — a hierarquia da tela
 * decide qual usar, não o gosto:
 *   primary   → a única ação principal da tela
 *   secondary → ações de apoio, com borda
 *   ghost     → ações densas (barras de ferramenta, linhas de tabela)
 *   accent    → reservada a momentos de conversão; use com parcimônia
 *   danger    → ações destrutivas
 *
 * Alturas alinhadas às dos campos de formulário (28/34/40) para que
 * qualquer combinação numa mesma linha fique alinhada sem ajuste manual.
 */

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger"
type Size = "sm" | "md" | "lg"

const base =
  "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-DEFAULT " +
  "select-none active:scale-[0.985] " +
  "disabled:pointer-events-none disabled:opacity-45 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[var(--canvas)]"

const variants: Record<Variant, string> = {
  primary:
    "bg-solid text-fg-on-solid shadow-xs hover:bg-solid-hover",
  secondary:
    "bg-surface text-fg border border-line-strong shadow-xs hover:bg-surface-hover hover:border-fg-faint",
  ghost:
    "bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg",
  accent:
    "bg-accent text-fg-on-accent shadow-xs hover:bg-accent-hover",
  danger:
    "bg-negative-soft text-negative border border-[color:var(--negative)]/25 hover:bg-negative hover:text-white hover:border-negative",
}

const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-[34px] px-3.5 text-sm",
  lg: "h-10 px-4 text-base",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  /** Ocupa toda a largura do container — útil em formulários e mobile. */
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, block, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], block && "w-full", className)}
      {...props}
    >
      {/* O conteúdo perde opacidade em vez de sair do fluxo: o botão
          não muda de largura ao entrar em carregamento. */}
      <span className={cn("inline-flex items-center gap-1.5", loading && "opacity-0")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
    </button>
  )
})

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Botão só-ícone. Exige `label` — sem ele o alvo fica mudo para leitores
 * de tela, que é o erro mais comum neste componente.
 */
export interface IconButtonProps extends Omit<ButtonProps, "block" | "children"> {
  label: string
  children: React.ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", className, children, ...props },
  ref
) {
  const square = { sm: "h-7 w-7", md: "h-[34px] w-[34px]", lg: "h-10 w-10" }[size]
  return (
    <Button
      ref={ref}
      size={size}
      aria-label={label}
      title={label}
      className={cn("px-0", square, className)}
      {...props}
    >
      {children}
    </Button>
  )
})
