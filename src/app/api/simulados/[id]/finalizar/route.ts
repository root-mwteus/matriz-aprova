import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

/**
 * Finaliza um simulado no servidor.
 *
 * Antes, o próprio cliente calculava os acertos e gravava direto em
 * `simulations` — a RLS deixava o usuário alterar a própria linha, então
 * dava para inflar pontuação/tempo pelo console e subir no ranking. A
 * migração 012 removeu o UPDATE de cliente; esta rota recomputa os
 * acertos a partir das respostas enviadas e do gabarito guardado na
 * linha do simulado, e só então grava.
 */

const MAX_TEMPO_SIMULADO = 180 * 60 // 3h, teto das opções de duração

const FinalizarSchema = z.object({
  respostas: z.record(z.string(), z.number().int().min(0).max(4)),
  tempoTotal: z.number().int().min(0).max(MAX_TEMPO_SIMULADO),
})

interface QuestaoSimulacao {
  id: string
  materia: string | null
  resposta_correta: number
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = FinalizarSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: sim } = await service
    .from("simulations")
    .select("id, user_id, questoes, pontuacao")
    .eq("id", params.id)
    .single()

  if (!sim || sim.user_id !== user.id) {
    return NextResponse.json({ error: "Simulado não encontrado" }, { status: 404 })
  }

  if (sim.pontuacao !== -1) {
    return NextResponse.json({ error: "Simulado já finalizado" }, { status: 409 })
  }

  const questoes = (sim.questoes ?? []) as QuestaoSimulacao[]

  let acertos = 0
  const questoesFinal = questoes.map((q) => {
    const respostaDada = parsed.data.respostas[q.id] ?? null
    if (respostaDada !== null && respostaDada === q.resposta_correta) acertos++
    return {
      id: q.id,
      materia: q.materia ?? null,
      resposta_correta: q.resposta_correta,
      resposta_dada: respostaDada,
    }
  })

  const { error } = await service
    .from("simulations")
    .update({
      pontuacao: acertos,
      tempo_total: parsed.data.tempoTotal,
      questoes: questoesFinal,
    })
    .eq("id", params.id)

  if (error) {
    console.error("Erro ao finalizar simulado:", error)
    return NextResponse.json({ error: "Erro ao finalizar simulado" }, { status: 500 })
  }

  return NextResponse.json({ pontuacao: acertos, tempo_total: parsed.data.tempoTotal })
}
