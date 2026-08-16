import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Ligas semanais: pontos acumulados por semana (chave = segunda-feira
 * da semana). A liga de cada um é a fatia de 50 posições que ocupa no
 * ranking da semana — promoção/rebaixamento é só mudar de fatia, não
 * precisa de job que reseta nada: a semana vira sozinha pela chave.
 */

export const PONTOS = {
  RESPOSTA: 1,
  ACERTO: 2,
  SIMULADO: 5,
  DUELO_VITORIA: 10,
  DUELO_EMPATE: 5,
  DUELO_DERROTA: 2,
} as const

/** Segunda-feira da semana da data, em YYYY-MM-DD (UTC, igual ao banco). */
export function chaveSemana(agora: Date = new Date()): string {
  const dia = agora.getUTCDay()
  const offsetParaSegunda = dia === 0 ? -6 : 1 - dia
  const segunda = new Date(agora)
  segunda.setUTCDate(segunda.getUTCDate() + offsetParaSegunda)
  return segunda.toISOString().slice(0, 10)
}

/**
 * Soma pontos à semana corrente. Falha silenciosa: ponto de liga é
 * enfeite — nunca pode derrubar uma resposta ou um simulado.
 */
export async function registrarPontosLiga(
  service: SupabaseClient,
  userId: string,
  pontos: number
): Promise<void> {
  if (pontos <= 0) return
  try {
    const { error } = await service.rpc("somar_pontos_liga", {
      p_user_id: userId,
      p_semana: chaveSemana(),
      p_pontos: pontos,
    })
    if (error) throw error
  } catch (e) {
    console.error("[liga]", e)
  }
}
