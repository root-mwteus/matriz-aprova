"use client"

import { forwardRef, useId } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Campos de formulário.
 *
 * O estilo visual mora na classe `.field` (globals.css) para que input,
 * textarea e select compartilhem exatamente a mesma borda, altura, foco
 * e estado inválido — sem chance de divergirem com o tempo.
 */

/* ── Wrapper com rótulo, dica e erro ─────────────────────────────── */

interface FieldProps {
  label?: string
  hint?: string
  error?: string
  /** Marca visualmente o campo como opcional em vez de sinalizar os obrigatórios:
      formulários bons têm mais campos obrigatórios do que opcionais. */
  optional?: boolean
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => React.ReactNode
  className?: string
}

export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium text-fg">
          {label}
          {optional && <span className="text-xs font-normal text-fg-faint">opcional</span>}
        </label>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-negative">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/* ── Input ───────────────────────────────────────────────────────── */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Elemento decorativo à esquerda (ícone, prefixo). */
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, trailing, ...props },
  ref
) {
  if (!leading && !trailing) {
    return <input ref={ref} className={cn("field", className)} {...props} />
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint">
          {leading}
        </span>
      )}
      <input
        ref={ref}
        className={cn("field", leading && "pl-8", trailing && "pr-8", className)}
        {...props}
      />
      {trailing && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-faint">{trailing}</span>
      )}
    </div>
  )
})

/* ── Busca ───────────────────────────────────────────────────────── */

export const SearchInput = forwardRef<HTMLInputElement, InputProps>(function SearchInput(
  { placeholder = "Buscar…", ...props },
  ref
) {
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      placeholder={placeholder}
      leading={<Search size={14} strokeWidth={2} />}
      {...props}
    />
  )
})

/* ── Textarea ────────────────────────────────────────────────────── */

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn("field", className)} {...props} />
  }
)

/* ── Select ──────────────────────────────────────────────────────── */

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={cn("field", className)} {...props}>
      {options
        ? options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : children}
    </select>
  )
})

/* ── Checkbox ────────────────────────────────────────────────────── */

export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-[15px] w-[15px] shrink-0 cursor-pointer appearance-none rounded-[4px] border border-line-strong bg-surface",
          "transition-colors duration-fast",
          "checked:border-accent-ink checked:bg-accent-ink",
          "checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5l3 3 6-6%22/></svg>')] checked:bg-center checked:bg-no-repeat",
          "hover:border-fg-faint disabled:cursor-not-allowed disabled:opacity-45",
          className
        )}
        {...props}
      />
    )
  }
)
