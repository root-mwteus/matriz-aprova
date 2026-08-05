import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

/**
 * GET /api/admin/pagamentos
 *
 * Lista de pagamentos com resumo financeiro para o painel admin.
 * Filtros por status e busca por nome/e-mail do aluno.
 */

export async function GET(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get("status") ?? "todos"
  const busca = url.searchParams.get("busca") ?? ""

  let query = supabase
    .from("pagamentos")
    .select("id, user_id, mp_payment_id, status, valor, created_at, updated_at, profile:user_id(nome, email)", {
      count: "exact",
    })

  if (status !== "todos") {
    query = query.eq("status", status)
  }

  const from = 0
  const to = 49
  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("admin: erro ao listar pagamentos", error)
    return NextResponse.json({ error: "Falha ao carregar pagamentos" }, { status: 500 })
  }

  const { data: resumoData } = await supabase.from("pagamentos").select("status, valor")

  let receitaAprovada = 0
  let receitaPendente = 0
  let aprovados = 0
  let pendentes = 0
  let rejeitados = 0
  for (const p of resumoData ?? []) {
    if (p.status === "approved") {
      receitaAprovada += Number(p.valor)
      aprovados += 1
    } else if (p.status === "pending") {
      receitaPendente += Number(p.valor)
      pendentes += 1
    } else {
      rejeitados += 1
    }
  }

  const pagamentos = (data ?? []).map((p) => {
    const perfil = Array.isArray(p.profile) ? p.profile[0] : p.profile
    return {
      id: p.id,
      mp_payment_id: p.mp_payment_id,
      status: p.status,
      valor: Number(p.valor),
      created_at: formatarData(p.created_at),
      aluno_nome: (perfil as any)?.nome ?? null,
      aluno_email: (perfil as any)?.email ?? null,
    }
  })

  return NextResponse.json({
    pagamentos,
    total: count ?? 0,
    resumo: {
      receitaAprovada,
      receitaPendente,
      aprovados,
      pendentes,
      rejeitados,
      totalPagamentos: (resumoData ?? []).length,
    },
  })
}
