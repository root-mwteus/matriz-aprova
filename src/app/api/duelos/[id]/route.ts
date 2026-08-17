import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"
import {
  TEMPO_PARTIDA_MS,
  finalizarDuelo,
  detalharQuestoes,
  jogadoresDoDuelo,
  souJogador,
  type Duelo,
} from "@/lib/duelo"

export const dynamic = "force-dynamic"

/**
 * GET /api/duelos/[id] — estado da partida.
 *
 * Serve de polling para quem espera na fila e de consulta do
 * resultado. Aproveita para as manutenções preguiçosas: busca
 * expirada (> 2 min) e partida abandonada (> 10 min) são fechadas
 * aqui, sem cron.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  let { data: duelo } = await service.from("duelos").select("*").eq("id", params.id).single()

  if (!duelo || !souJogador(duelo as Duelo, user.id)) {
    return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 })
  }

  // Partida ativa parada no tempo: fecha com o placar que houver.
  if (
    duelo.status === "ativo" &&
    duelo.started_at &&
    Date.now() - new Date(duelo.started_at).getTime() > TEMPO_PARTIDA_MS
  ) {
    duelo = await finalizarDuelo(service, duelo as Duelo)
  }

  const comGabarito = duelo.status === "finalizado"
  const questoes = await detalharQuestoes(service, duelo.questoes, comGabarito)
  const jogadores = await jogadoresDoDuelo(service, [duelo.jogador_a, duelo.jogador_b])

  return NextResponse.json({ duelo: { ...duelo, questoes_detalhes: questoes }, jogadores, meu_id: user.id })
}

/**
 * POST /api/duelos/[id] — cancelar busca (só quem criou, só esperando).
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: duelo } = await service.from("duelos").select("*").eq("id", params.id).single()

  if (!duelo || duelo.jogador_a !== user.id) {
    return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 })
  }

  if (duelo.status !== "aguardando") {
    return NextResponse.json({ error: "Só buscas aguardando oponente podem ser canceladas" }, { status: 409 })
  }

  await service.from("duelos").update({ status: "cancelado" }).eq("id", params.id)

  return NextResponse.json({ ok: true })
}
