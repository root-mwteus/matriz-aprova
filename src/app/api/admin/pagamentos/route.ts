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
    .select("id, user_id, transaction_nsu, status, valor, created_at, updated_at", {
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

  // Sem FK entre pagamentos.user_id e profiles, o embed do PostgREST
  // falha (PGRST200) — busca os perfis numa segunda query e mescla.
  const userIds = Array.from(new Set((data ?? []).map((p) => p.user_id)))
  const { data: perfis } = userIds.length
    ? await supabase.from("profiles").select("id, nome, email").in("id", userIds)
    : { data: null }
  const perfilPorId = new Map((perfis ?? []).map((pr) => [pr.id, pr]))

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
    const perfil = perfilPorId.get(p.user_id)
    return {
      id: p.id,
      transaction_nsu: p.transaction_nsu,
      status: p.status,
      valor: Number(p.valor),
      created_at: formatarData(p.created_at),
      aluno_nome: perfil?.nome ?? null,
      aluno_email: perfil?.email ?? null,
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
