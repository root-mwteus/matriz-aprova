import type { SupabaseClient } from "@supabase/supabase-js"
import { PONTOS, registrarPontosLiga } from "@/lib/liga"

/**
 * Duelo 1v1: 5 questões, quem acerta mais vence (empate: menor tempo
 * total). A linha de `duelos` guarda só os ids das questões — o
 * gabarito é consultado em `questions` na hora de validar, no
 * servidor. Guardá-lo na linha vazaria pelo payload do Realtime.
 */

export const QUESTOES_POR_DUELO = 5
export const TEMPO_BUSCA_MS = 2 * 60 * 1000
export const TEMPO_PARTIDA_MS = 10 * 60 * 1000

export interface RespostaDuelo {
  questao_id: string
  resposta_dada: number
  correto: boolean
}

export interface Duelo {
  id: string
  status: "aguardando" | "ativo" | "finalizado" | "expirado" | "cancelado"
  jogador_a: string
  jogador_b: string | null
  questoes: string[]
  respostas_a: RespostaDuelo[]
  respostas_b: RespostaDuelo[]
  acertos_a: number
  acertos_b: number
  tempo_a: number
  tempo_b: number
  vencedor: string | null
  created_at: string
  started_at: string | null
}

export function souJogador(duelo: Duelo, userId: string) {
  return duelo.jogador_a === userId || duelo.jogador_b === userId
}

export function oponente(duelo: Duelo, userId: string): string | null {
  if (duelo.jogador_a === userId) return duelo.jogador_b
  if (duelo.jogador_b === userId) return duelo.jogador_a
  return null
}

export interface JogadorResumo {
  nome: string
  icone_path: string | null
  moldura_id: string | null
}

/**
 * Aparência dos dois jogadores do duelo (nome, ícone e moldura), para a
 * tela mostrar contra quem se está disputando. Busca em lote no service.
 */
export async function jogadoresDoDuelo(
  service: SupabaseClient,
  ids: (string | null)[]
): Promise<Record<string, JogadorResumo>> {
  const unicos = Array.from(new Set(ids.filter(Boolean) as string[]))
  if (!unicos.length) return {}

  const { data } = await service
    .from("profiles")
    .select("id, nome, icone_path, moldura_id")
    .in("id", unicos)

  const mapa: Record<string, JogadorResumo> = {}
  for (const p of data ?? []) {
    mapa[p.id] = {
      nome: p.nome || "Anônimo",
      icone_path: p.icone_path,
      moldura_id: p.moldura_id,
    }
  }
  return mapa
}

/**
 * Fecha a partida e pontua a liga. Critério: acertos; empate decide
 * pelo tempo total (quem terminou antes). Vencedor null = empate
 * (mesmos acertos E mesmo tempo).
 */
export async function finalizarDuelo(service: SupabaseClient, duelo: Duelo): Promise<Duelo> {
  let vencedor: string | null = null
  if (duelo.acertos_a !== duelo.acertos_b) {
    vencedor =
      duelo.acertos_a > duelo.acertos_b ? duelo.jogador_a : (duelo.jogador_b ?? duelo.jogador_a)
  } else if (duelo.tempo_a !== duelo.tempo_b) {
    vencedor = duelo.tempo_a < duelo.tempo_b ? duelo.jogador_a : (duelo.jogador_b ?? duelo.jogador_a)
  }

  const { data, error } = await service
    .from("duelos")
    .update({ status: "finalizado", vencedor })
    .eq("id", duelo.id)
    .select()
    .single()

  if (error) throw error

  const pontos = (id: string | null) =>
    vencedor === null ? PONTOS.DUELO_EMPATE : vencedor === id ? PONTOS.DUELO_VITORIA : PONTOS.DUELO_DERROTA
  if (duelo.jogador_b) {
    await registrarPontosLiga(service, duelo.jogador_a, pontos(duelo.jogador_a))
    await registrarPontosLiga(service, duelo.jogador_b, pontos(duelo.jogador_b))
  }

  return data as Duelo
}

/**
 * Questões do duelo para exibição. O gabarito só sai quando a partida
 * acabou — durante o jogo o cliente recebe enunciado e alternativas.
 */
export async function detalharQuestoes(
  service: SupabaseClient,
  ids: string[],
  comGabarito: boolean
) {
  const { data, error } = await service
    .from("questions")
    .select("id, enunciado, alternativas, banca, ano, materia" + (comGabarito ? ", resposta_correta, explicacao" : ""))
    .in("id", ids)

  if (error) throw error

  // Mantém a ordem do sorteio. O select dinâmico (com/sem gabarito)
  // quebra a inferência do supabase-js — o cast resolve.
  const porId = new Map(((data ?? []) as unknown as { id: string }[]).map((q) => [q.id, q]))
  return ids.map((id) => porId.get(id)).filter(Boolean)
}
