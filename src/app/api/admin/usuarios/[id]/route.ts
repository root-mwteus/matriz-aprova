import { NextResponse } from "next/server"
import { requireAdmin, type AdminSupabase } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function formatarDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

function formatarTempoCurto(segundos: number) {
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

async function buscarQuestoes(supabase: AdminSupabase, ids: string[]) {
  const unicos = Array.from(new Set(ids))
  const mapa = new Map<string, { materia: string; banca: string | null; ano: number | null }>()
  for (let i = 0; i < unicos.length; i += 300) {
    const { data } = await supabase.from("questions").select("id, materia, banca, ano").in("id", unicos.slice(i, i + 300))
    data?.forEach((q) => mapa.set(q.id, q))
  }
  return mapa
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("profiles")
    .select("id, nome, email, area_concurso, data_prova, created_at, suspenso, plano")
    .eq("id", params.id)
    .single()

  if (perfilError || !perfil) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 29)
  trintaDiasAtras.setHours(0, 0, 0, 0)

  const [
    { data: respostas },
    { data: datasAtividade },
    { count: planos },
    { count: aulasConcluidas },
    { data: simulacoes },
    { data: pagamentos },
  ] = await Promise.all([
    supabase.from("user_answers").select("question_id, correto, tempo_segundos, created_at").eq("user_id", params.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("user_answers").select("created_at").eq("user_id", params.id).gte("created_at", trintaDiasAtras.toISOString()),
    supabase.from("study_plans").select("*", { count: "exact", head: true }).eq("user_id", params.id),
    supabase.from("progress").select("*", { count: "exact", head: true }).eq("user_id", params.id).eq("concluido", true),
    supabase.from("simulations").select("id, questoes, pontuacao, tempo_total, created_at").eq("user_id", params.id).not("pontuacao", "eq", -1).order("created_at", { ascending: false }).limit(20),
    supabase.from("pagamentos").select("*").eq("user_id", params.id).order("created_at", { ascending: false }),
  ])

  const questaoMap = await buscarQuestoes(supabase, (respostas ?? []).map((r) => r.question_id))

  const porMateria = new Map<string, { questoes: number; acertos: number }>()
  for (const r of respostas ?? []) {
    const q = questaoMap.get(r.question_id)
    const materia = q?.materia || "Sem matéria"
    const rec = porMateria.get(materia) ?? { questoes: 0, acertos: 0 }
    rec.questoes++
    if (r.correto) rec.acertos++
    porMateria.set(materia, rec)
  }

  const progresso = Array.from(porMateria.entries())
    .map(([materia, { questoes, acertos }]) => ({
      materia,
      questoes,
      acertos,
      pct: questoes ? Math.round((acertos / questoes) * 100) : 0,
    }))
    .sort((a, b) => b.questoes - a.questoes)

  const diasAtivos = new Set((datasAtividade ?? []).map((r) => new Date(r.created_at).toDateString()))
  const calendario = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return { day: d.getDate(), active: diasAtivos.has(d.toDateString()) }
  })

  const questoesRecentes = (respostas ?? []).slice(0, 50).map((r) => {
    const q = questaoMap.get(r.question_id)
    return {
      materia: q?.materia || "—",
      banca: q?.banca || "—",
      ano: q?.ano ? String(q.ano) : "—",
      resultado: r.correto ? "✓" : "✗",
      tempo: formatarTempoCurto(r.tempo_segundos || 0),
      data: formatarDataCurta(r.created_at),
    }
  })

  const simulados = (simulacoes ?? []).map((s) => {
    const qs = s.questoes ?? []
    const total = qs.length
    const acertos = Number(s.pontuacao)
    return {
      id: s.id,
      titulo: qs[0]?.materia ? `Simulado de ${qs[0].materia}` : "Simulado",
      questoes: total,
      acertos,
      pct: total ? Math.round((acertos / total) * 100) : 0,
      data: formatarData(s.created_at),
    }
  })

  return NextResponse.json({
    perfil,
    resumo: {
      planos: planos ?? 0,
      aulasConcluidas: aulasConcluidas ?? 0,
      simulados: simulados.length,
    },
    progresso,
    questoes: questoesRecentes,
    simulados,
    calendario,
    pagamentos: (pagamentos ?? []).map((p) => ({
      id: p.id,
      mp_payment_id: p.mp_payment_id,
      status: p.status,
      valor: p.valor,
      created_at: formatarData(p.created_at),
    })),
  })
}

/** Troca manual do plano (usado pelo admin para ativar vitalício sem pagamento). */
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { plano } = await _request.json().catch(() => ({}))
  if (plano !== "demo" && plano !== "vitalicio") {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
  }

  const { error } = await supabase
    .from("profiles")
    .update({ plano })
    .eq("id", params.id)

  if (error) {
    console.error("admin: erro ao atualizar plano", error)
    return NextResponse.json({ error: "Falha ao atualizar o plano" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
