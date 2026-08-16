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

/**
 * Dias entre hoje e a data alvo (0 = hoje, negativo = já passou).
 * Conta em dias civis, não em 24h — "amanhã" é 1 mesmo que faltem
 * 23h para completar o dia. Era duplicada em editais e plano.
 */
export function diasAte(data: string | Date): number {
  const alvo = typeof data === "string" ? new Date(`${data}T00:00:00`) : new Date(data)
  const hoje = new Date()
  alvo.setHours(0, 0, 0, 0)
  hoje.setHours(0, 0, 0, 0)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86_400_000)
}
