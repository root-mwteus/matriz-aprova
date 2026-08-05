import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida o destino de um redirect após login/cadastro.
 * Só aceita caminho interno (`/assinar`, `/dashboard`, ...) — bloqueia
 * URLs externas e protocolos, evitando open redirect.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null
  if (!next.startsWith("/")) return null
  if (next.startsWith("//")) return null
  if (next.includes("://")) return null
  return next
}
