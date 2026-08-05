import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getConfigPagamentos, parseValorParaCentavos } from "@/lib/pagamentos-config"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/pagamentos/config
 *
 * Retorna a configuração atual de pagamentos para o painel admin.
 */

export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const config = await getConfigPagamentos(supabase)

  const { data: row } = await supabase.from("config_pagamentos").select("*").eq("id", 1).single()

  return NextResponse.json({
    config,
    atualizada_em: row?.updated_at ?? null,
  })
}

/**
 * PUT /api/admin/pagamentos/config
 *
 * Salva a configuração editada no painel admin. Valida cada campo antes
 * de persistir. `valorTexto` chega como "49,99" e é convertido para
 * centavos no servidor — o valor numérico nunca vem do cliente.
 */

export async function PUT(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { tituloPlano, descricaoPlano, valorTexto, beneficios, limiteQuestoesDemo, avisoBloqueio, pagamentosAtivos } = body

  if (typeof tituloPlano !== "string" || tituloPlano.trim().length === 0) {
    return NextResponse.json({ error: "Título do plano é obrigatório" }, { status: 400 })
  }
  if (typeof descricaoPlano !== "string" || descricaoPlano.trim().length === 0) {
    return NextResponse.json({ error: "Descrição do plano é obrigatória" }, { status: 400 })
  }

  const valorCentavos = parseValorParaCentavos(String(valorTexto ?? ""))
  if (valorCentavos === null || valorCentavos <= 0) {
    return NextResponse.json({ error: "Valor inválido — use o formato 49,99" }, { status: 400 })
  }
  if (valorCentavos > 10000000) {
    return NextResponse.json({ error: "Valor acima do limite permitido" }, { status: 400 })
  }

  if (!Array.isArray(beneficios) || beneficios.some((b) => typeof b !== "string")) {
    return NextResponse.json({ error: "Lista de benefícios inválida" }, { status: 400 })
  }

  const limite = Number(limiteQuestoesDemo)
  if (!Number.isInteger(limite) || limite < 0) {
    return NextResponse.json({ error: "Limite diário do demo deve ser um número inteiro >= 0" }, { status: 400 })
  }

  if (typeof avisoBloqueio !== "string" || avisoBloqueio.trim().length === 0) {
    return NextResponse.json({ error: "Aviso de bloqueio é obrigatório" }, { status: 400 })
  }

  const { error } = await supabase
    .from("config_pagamentos")
    .update({
      titulo_plano: tituloPlano.trim(),
      descricao_plano: descricaoPlano.trim(),
      valor_centavos: valorCentavos,
      beneficios: beneficios.map((b: string) => b.trim()).filter(Boolean),
      limite_questoes_demo: limite,
      aviso_bloqueio: avisoBloqueio.trim(),
      pagamentos_ativos: pagamentosAtivos === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)

  if (error) {
    console.error("admin: erro ao salvar config de pagamentos", error)
    return NextResponse.json({ error: "Falha ao salvar a configuração" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
