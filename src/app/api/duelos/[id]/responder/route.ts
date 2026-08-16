import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { finalizarDuelo, type Duelo, type RespostaDuelo } from "@/lib/duelo"

export const dynamic = "force-dynamic"

/**
 * POST /api/duelos/[id]/responder
 *
 * Valida a resposta no servidor (gabarito vem de `questions`, nunca
 * da linha do duelo), soma acerto/tempo e — quando os dois lados
 * responderam tudo — fecha a partida e pontua a liga. O adversário
 * fica sabendo pelo UPDATE do Realtime na própria linha.
 */

const ResponderSchema = z.object({
  questao_id: z.string().uuid(),
  /** Índice 0-4 da alternativa; -1 = pulou (tempo esgotado). */
  resposta: z.number().int().min(-1).max(4),
  tempo_segundos: z.number().int().min(0).max(300),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = ResponderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: duelo } = await service.from("duelos").select("*").eq("id", params.id).single()

  if (!duelo || (duelo.jogador_a !== user.id && duelo.jogador_b !== user.id)) {
    return NextResponse.json({ error: "Duelo não encontrado" }, { status: 404 })
  }

  if (duelo.status !== "ativo") {
    return NextResponse.json({ error: "Duelo não está em andamento" }, { status: 409 })
  }

  const souA = duelo.jogador_a === user.id
  const minhasRespostas: RespostaDuelo[] = souA ? duelo.respostas_a : duelo.respostas_b
  const oponenteRespostas: RespostaDuelo[] = souA ? duelo.respostas_b : duelo.respostas_a

  if (!duelo.questoes.includes(parsed.data.questao_id)) {
    return NextResponse.json({ error: "Questão não faz parte deste duelo" }, { status: 400 })
  }

  if (minhasRespostas.some((r) => r.questao_id === parsed.data.questao_id)) {
    return NextResponse.json({ error: "Questão já respondida" }, { status: 409 })
  }

  const { data: questao } = await service
    .from("questions")
    .select("resposta_correta")
    .eq("id", parsed.data.questao_id)
    .single()

  if (!questao) {
    return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 })
  }

  const correto = parsed.data.resposta === questao.resposta_correta

  const novasRespostas = [
    ...minhasRespostas,
    {
      questao_id: parsed.data.questao_id,
      resposta_dada: parsed.data.resposta,
      correto,
    },
  ]

  const totalQuestoes = (duelo.questoes ?? []).length
  const atualizacao: Record<string, unknown> = souA
    ? {
        respostas_a: novasRespostas,
        acertos_a: duelo.acertos_a + (correto ? 1 : 0),
        tempo_a: duelo.tempo_a + parsed.data.tempo_segundos,
      }
    : {
        respostas_b: novasRespostas,
        acertos_b: duelo.acertos_b + (correto ? 1 : 0),
        tempo_b: duelo.tempo_b + parsed.data.tempo_segundos,
      }

  const completudeOponente = oponenteRespostas.length >= totalQuestoes
  const completudeMinha = novasRespostas.length >= totalQuestoes

  if (completudeMinha && completudeOponente) {
    // Última resposta do duelo: grava o placar atualizado e só então
    // fecha — o retorno já leva o resultado.
    const { error: erroUpdate } = await service
      .from("duelos")
      .update(atualizacao)
      .eq("id", params.id)
    if (erroUpdate) throw erroUpdate

    const fechado = await finalizarDuelo(service, {
      ...(duelo as Duelo),
      ...(atualizacao as Partial<Duelo>),
    })

    return NextResponse.json({
      ok: true,
      correto,
      resposta_correta: questao.resposta_correta,
      oponente_respondidas: oponenteRespostas.length,
      status: fechado.status,
      resultado: {
        vencedor: fechado.vencedor,
        meus_acertos: souA ? fechado.acertos_a : fechado.acertos_b,
        acertos_oponente: souA ? fechado.acertos_b : fechado.acertos_a,
        meu_tempo: souA ? fechado.tempo_a : fechado.tempo_b,
        tempo_oponente: souA ? fechado.tempo_b : fechado.tempo_a,
      },
    })
  }

  const { error } = await service.from("duelos").update(atualizacao).eq("id", params.id)

  if (error) {
    console.error("duelos: erro ao registrar resposta", error)
    return NextResponse.json({ error: "Falha ao registrar a resposta" }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    correto,
    resposta_correta: questao.resposta_correta,
    oponente_respondidas: oponenteRespostas.length,
    status: "ativo",
  })
}
