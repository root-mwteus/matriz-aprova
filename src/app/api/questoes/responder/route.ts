import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { PONTOS, registrarPontosLiga } from "@/lib/liga"

/**
 * POST /api/questoes/responder
 *
 * Registra a resposta de uma questão. A resposta e o gabarito são
 * conferidos no servidor — o cliente não decide o `correto`. Só o
 * plano vitalício pode responder questões — o demo recebe 403.
 */
export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: perfil } = await service
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .single()

  if (perfil?.plano !== "vitalicio") {
    return NextResponse.json(
      {
        error: "Questões comentadas estão disponíveis no plano vitalício.",
        precisaPlano: true,
      },
      { status: 403 }
    )
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

  // Liga da semana: respondeu soma 1, acertou soma mais 2. Falha
  // silenciosa — ponto é enfeite, resposta é o produto.
  await registrarPontosLiga(
    service,
    user.id,
    PONTOS.RESPOSTA + (correto ? PONTOS.ACERTO : 0)
  )

  return NextResponse.json({ ok: true })
}
