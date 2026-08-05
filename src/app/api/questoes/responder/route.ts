import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * POST /api/questoes/responder
 *
 * Registra a resposta de uma questão. A resposta e o gabarito são
 * conferidos no servidor — o cliente não decide o `correto`.
 */
export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  let body: { question_id?: string; resposta_dada?: number; tempo_segundos?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 })
  }

  if (!body.question_id || typeof body.resposta_dada !== "number") {
    return NextResponse.json({ error: "question_id e resposta_dada são obrigatórios" }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: questao } = await service
    .from("questions")
    .select("resposta_correta")
    .eq("id", body.question_id)
    .single()

  if (!questao) {
    return NextResponse.json({ error: "Questão não encontrada" }, { status: 404 })
  }

  const correto = body.resposta_dada === questao.resposta_correta

  const { error } = await service.from("user_answers").insert({
    user_id: user.id,
    question_id: body.question_id,
    resposta_dada: body.resposta_dada,
    correto,
    tempo_segundos: Number.isInteger(body.tempo_segundos) ? body.tempo_segundos : null,
  })

  if (error) {
    console.error("responder: erro ao salvar resposta", error)
    return NextResponse.json({ error: "Falha ao registrar a resposta" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
