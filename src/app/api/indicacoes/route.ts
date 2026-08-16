import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Indicações — desconto para o indicado.
 *
 * GET  → meu código de indicação + quantos cadastros usei.
 * POST → registra o código que o NOVO usuário trouxe (chamado pelo
 *        cadastro com `?ref=CODIGO`). Validações server-side: código
 *        existe, não é a própria conta, e uma indicação por conta
 *        (UNIQUE no indicado). Inserção é service-role: sem isso,
 *        qualquer cliente fabricaria "indicação" de terceiros.
 */

const IndicarSchema = z.object({
  codigo: z.string().trim().min(4).max(16),
})

export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: perfil } = await service
    .from("profiles")
    .select("codigo_indicacao")
    .eq("id", user.id)
    .single()

  const { count } = await service
    .from("indicacoes")
    .select("id", { count: "exact", head: true })
    .eq("indicador_id", user.id)

  return NextResponse.json({
    codigo: perfil?.codigo_indicacao ?? null,
    usos: count ?? 0,
  })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = IndicarSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: indicador } = await service
    .from("profiles")
    .select("id")
    .eq("codigo_indicacao", parsed.data.codigo.toUpperCase())
    .maybeSingle()

  if (!indicador) {
    return NextResponse.json({ error: "Código de indicação não encontrado" }, { status: 404 })
  }

  if (indicador.id === user.id) {
    return NextResponse.json({ error: "Não é possível usar o próprio código" }, { status: 400 })
  }

  // UNIQUE(indicado_id) + onConflict: já usou código de alguém? Mantém
  // o primeiro — não troca de indicador tentando outro código.
  const { error } = await service.from("indicacoes").upsert(
    { indicador_id: indicador.id, indicado_id: user.id, status: "pendente" },
    { onConflict: "indicado_id", ignoreDuplicates: true }
  )

  if (error) {
    console.error("indicacoes: erro ao registrar", error)
    return NextResponse.json({ error: "Falha ao registrar a indicação" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
