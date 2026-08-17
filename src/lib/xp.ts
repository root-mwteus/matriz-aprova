import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Níveis e XP.
 *
 * O XP acumula em `profiles.xp_total`; o nível é função pura do XP —
 * não existe coluna `nivel`, então nada dessincroniza e mudar a curva
 * só exige ajustar `XP_POR_NIVEL`. Curva triangular: o nível N exige
 * `XP_POR_NIVEL · N · (N-1) / 2` XP total (L1 = 0, L2 = 100, L3 = 300,
 * L4 = 600, L5 = 1000, L10 = 4500).
 *
 * A soma é feita no banco por `somar_xp` (SECURITY DEFINER), que dedupe
 * por origem e aplica o teto diário — retry de resposta/simulado/duelo
 * não pontua duas vezes.
 */

export const XP = {
  RESPOSTA: 10,
  ACERTO: 10,
  SIMULADO: 50,
  DUELO_VITORIA: 100,
  DUELO_EMPATE: 50,
  DUELO_DERROTA: 25,
} as const

/** Base da curva triangular de níveis (XP para passar do L1 ao L2). */
export const XP_POR_NIVEL = 100

/** XP total necessário para atingir o nível `nivel` (L1 = 0). */
export function xpParaNivel(nivel: number): number {
  if (nivel <= 1) return 0
  return (XP_POR_NIVEL * nivel * (nivel - 1)) / 2
}

/** Nível atual para um total de XP (L1 no 0 XP). */
export function nivelDeXp(xp: number): number {
  if (xp <= 0) return 1
  // Soma triangular: n² - n - 2·xp/POR_NIVEL ≥ 0 → nível = (1 + sqrt(1 + 8·xp/POR_NIVEL)) / 2.
  const raiz = Math.sqrt(1 + (8 * xp) / XP_POR_NIVEL)
  return Math.floor((1 + raiz) / 2)
}

export interface ProgressoNivel {
  nivel: number
  xpTotal: number
  xpBase: number
  xpAlvo: number
  faltando: number
  /** 0–100, quantos % faltam para o próximo nível. */
  progresso: number
}

/** Progresso do nível atual → próximo, para a barra de XP. */
export function xpProximoNivel(xp: number): ProgressoNivel {
  const nivel = nivelDeXp(xp)
  const xpBase = xpParaNivel(nivel)
  const xpAlvo = xpParaNivel(nivel + 1)
  const dentro = xp - xpBase
  const largura = xpAlvo - xpBase
  const progresso = largura > 0 ? Math.min(100, Math.round((dentro / largura) * 100)) : 100
  return { nivel, xpTotal: xp, xpBase, xpAlvo, faltando: xpAlvo - xp, progresso }
}

/**
 * Soma XP ao perfil. `tipo` + `origem_id` formam a chave de dedupe no
 * banco (`xp_historico`) — cada resposta/simulado/duelo pontua uma vez,
 * mesmo se a requisição repetir. Falha silenciosa como a liga: XP é
 * progresso, nunca pode derrubar uma resposta.
 */
export async function somarXp(
  service: SupabaseClient,
  userId: string,
  tipo: "questao" | "simulado" | "duelo",
  origemId: string,
  xp: number
): Promise<void> {
  if (xp <= 0) return
  try {
    const { error } = await service.rpc("somar_xp", {
      p_user_id: userId,
      p_tipo: tipo,
      p_origem_id: origemId,
      p_xp: xp,
    })
    if (error) throw error
  } catch (e) {
    console.error("[xp]", e)
  }
}