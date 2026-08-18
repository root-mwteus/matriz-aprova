import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"
import {
  QUESTOES_POR_DUELO,
  TEMPO_BUSCA_MS,
  detalharQuestoes,
  jogadoresDoDuelo,
} from "@/lib/duelo"

export const dynamic = "force-dynamic"

/**
 * POST /api/duelos — fila rápida.
 *
 * Primeiro expira as buscas esquecidas (> 2 min); depois tenta
 * roubar uma partida aguardando de outro jogador (o UPDATE guarda o
 * status no WHERE — duas chegadas simultâneas não emparelham com o
 * mesmo duelo). Sem ninguém esperando, cria a própria linha e entra
 * na fila; o oponente faz a mesma rota e a partida começa.
 */
export async function POST() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: perfil } = await service
    .from("profiles")
    .select("plano, area_concurso")
    .eq("id", user.id)
    .single()

  if (perfil?.plano !== "vitalicio") {
    return NextResponse.json(
      { error: "Duelos estão disponíveis no plano vitalício.", precisaPlano: true },
      { status: 403 }
    )
  }

  // Idempotente: minha busca pendente continua valendo.
  const { data: minhaPendente } = await service
    .from("duelos")
    .select("id, status")
    .eq("jogador_a", user.id)
    .eq("status", "aguardando")
    .limit(1)
    .maybeSingle()

  if (minhaPendente) {
    return NextResponse.json({ status: "aguardando", id: minhaPendente.id })
  }

  // Limpeza preguiçosa da fila: buscas com mais de 2 min expiram.
  const expiradoAte = new Date(Date.now() - TEMPO_BUSCA_MS).toISOString()
  await service
    .from("duelos")
    .update({ status: "expirado" })
    .eq("status", "aguardando")
    .lt("created_at", expiradoAte)

  // Tenta emparelhar com quem já está esperando.
  const { data: candidato } = await service
    .from("duelos")
    .select("id")
    .eq("status", "aguardando")
    .neq("jogador_a", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (candidato) {
    // maybeSingle: o UPDATE só retorna a linha se o status ainda era
    // "aguardando" (perdeu a corrida → null, sem erro). `count` aqui
    // nunca viria populado sem count:'exact' — depender dele fazia o
    // pareamento sempre cair no "criar a própria", empilhando filas.
    const { data: duelo, error: erroPareamento } = await service
      .from("duelos")
      .update({
        jogador_b: user.id,
        status: "ativo",
        started_at: new Date().toISOString(),
      })
      .eq("id", candidato.id)
      .eq("status", "aguardando")
      .select()
      .maybeSingle()

    if (erroPareamento) {
      console.error("duelos: erro ao emparelhar", erroPareamento)
      return NextResponse.json({ error: "Falha ao buscar oponente" }, { status: 500 })
    }

    if (duelo) {
      const questoes = await detalharQuestoes(service, duelo.questoes, false)
      const jogadores = await jogadoresDoDuelo(service, [duelo.jogador_a, duelo.jogador_b])
      return NextResponse.json({
        status: "ativo",
        duelo: { ...duelo, questoes_detalhes: questoes },
        jogadores,
      })
    }
    // Perdeu a corrida para outro jogador — cai para criar a própria.
  }

  // Sorteio: 5 questões da minha área (qualquer, se a área não tem 5).
  let { data: sorteadas } = await service
    .from("questions")
    .select("id")
    .eq("area_concurso", perfil?.area_concurso ?? "")
    .limit(QUESTOES_POR_DUELO * 4)

  if ((sorteadas ?? []).length < QUESTOES_POR_DUELO) {
    const todas = await service.from("questions").select("id").limit(QUESTOES_POR_DUELO * 4)
    sorteadas = todas.data
  }

  if ((sorteadas ?? []).length < QUESTOES_POR_DUELO) {
    return NextResponse.json(
      { error: "Não há questões suficientes para montar um duelo" },
      { status: 503 }
    )
  }

  const embaralhadas = [...(sorteadas ?? [])].sort(() => Math.random() - 0.5).slice(0, QUESTOES_POR_DUELO)

  const { data: novo, error } = await service
    .from("duelos")
    .insert({
      jogador_a: user.id,
      questoes: embaralhadas.map((q: { id: string }) => q.id),
      status: "aguardando",
    })
    .select("id")
    .single()

  if (error || !novo) {
    console.error("duelos: erro ao entrar na fila", error)
    return NextResponse.json({ error: "Falha ao buscar oponente" }, { status: 500 })
  }

  return NextResponse.json({ status: "aguardando", id: novo.id })
}
