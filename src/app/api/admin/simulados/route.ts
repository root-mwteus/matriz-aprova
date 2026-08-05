import { NextResponse } from "next/server"
import { requireAdmin, type AdminSupabase } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const LIMITE = 500

interface QuestaoSimulada {
  id: string
  materia: string
  resposta_correta: number
  resposta_dada: number | null
}

interface LinhaSimulacao {
  id: string
  user_id: string
  questoes: QuestaoSimulada[] | null
  pontuacao: string | number
  tempo_total: number
  created_at: string
}

function formatarTempo(segundos: number) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = Math.floor(segundos % 60)
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":")
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

async function buscarBancas(supabase: AdminSupabase, ids: string[]) {
  const unicos = Array.from(new Set(ids))
  const mapa = new Map<string, string>()
  for (let i = 0; i < unicos.length; i += 300) {
    const { data } = await supabase.from("questions").select("id, banca").in("id", unicos.slice(i, i + 300))
    data?.forEach((q) => mapa.set(q.id, q.banca || ""))
  }
  return mapa
}

export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const { data } = await supabase
    .from("simulations")
    .select("id, user_id, questoes, pontuacao, tempo_total, created_at")
    .not("pontuacao", "eq", -1)
    .order("created_at", { ascending: false })
    .limit(LIMITE)

  const lista = (data ?? []) as LinhaSimulacao[]

  const userIds = Array.from(new Set(lista.map((s) => s.user_id)))
  const perfis = userIds.length
    ? await supabase.from("profiles").select("id, nome, area_concurso").in("id", userIds)
    : { data: [] }

  const nomes = new Map<string, string>((perfis.data ?? []).map((p) => [p.id, p.nome || "Anônimo"]))
  const areas = new Map<string, string | null>((perfis.data ?? []).map((p) => [p.id, p.area_concurso]))

  // Resumo
  const agora = new Date()
  const inicioHoje = new Date(agora)
  inicioHoje.setHours(0, 0, 0, 0)
  const inicioSemana = new Date(agora)
  inicioSemana.setDate(inicioSemana.getDate() - 6)
  inicioSemana.setHours(0, 0, 0, 0)

  let realizadoHoje = 0
  let realizadoSemana = 0
  const contagemMaterias = new Map<string, { total: number; corretas: number }>()
  for (const s of lista) {
    const dataCriacao = new Date(s.created_at)
    if (dataCriacao >= inicioHoje) realizadoHoje++
    if (dataCriacao >= inicioSemana) realizadoSemana++

    for (const q of s.questoes ?? []) {
      const rec = contagemMaterias.get(q.materia) ?? { total: 0, corretas: 0 }
      rec.total++
      if (q.resposta_dada === q.resposta_correta) rec.corretas++
      contagemMaterias.set(q.materia, rec)
    }
  }

  const piorMateria = Array.from(contagemMaterias.entries())
    .map(([materia, { total, corretas }]) => ({ materia, pct: total ? Math.round((corretas / total) * 100) : 0 }))
    .sort((a, b) => a.pct - b.pct)[0]

  const totalSims = lista.length
  const mediaPontuacao = totalSims
    ? Math.round(
        lista.reduce((acc, s) => {
          const t = s.questoes?.length || 0
          return acc + (t ? (Number(s.pontuacao) / t) * 100 : 0)
        }, 0) / totalSims
      )
    : 0

  // Ranking — melhor resultado de cada aluno
  const contagemPorUsuario = new Map<string, number>()
  const melhores = new Map<string, { user_id: string; pct: number; ultima: string }>()
  for (const s of lista) {
    contagemPorUsuario.set(s.user_id, (contagemPorUsuario.get(s.user_id) || 0) + 1)
    const t = s.questoes?.length || 0
    const pct = t ? Math.round((Number(s.pontuacao) / t) * 100) : 0
    const atual = melhores.get(s.user_id)
    if (!atual || pct > atual.pct) {
      melhores.set(s.user_id, { user_id: s.user_id, pct, ultima: s.created_at })
    }
  }

  const ranking = Array.from(melhores.values())
    .map((m) => ({
      id: m.user_id,
      aluno: nomes.get(m.user_id) || "Anônimo",
      area: areas.get(m.user_id) || "—",
      pontuacao: m.pct,
      simulados: contagemPorUsuario.get(m.user_id) || 0,
      ultima: formatarData(m.ultima),
    }))
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, 50)

  // Histórico — últimos 100, com a banca vinda das questões
  const recentes = lista.slice(0, 100)
  const bancas = await buscarBancas(supabase, recentes.flatMap((s) => s.questoes?.map((q) => q.id) ?? []))

  const historico = recentes.map((s) => {
    const qs = s.questoes ?? []
    const total = qs.length
    const acertos = Number(s.pontuacao)
    const banca = qs.map((q) => bancas.get(q.id)).find(Boolean) || "—"
    return {
      id: s.id,
      aluno: nomes.get(s.user_id) || "Anônimo",
      banca,
      questoes: total,
      acertos,
      pct: total ? Math.round((acertos / total) * 100) : 0,
      tempo: formatarTempo(s.tempo_total),
      data: formatarData(s.created_at),
    }
  })

  return NextResponse.json({
    resumo: {
      realizadoHoje,
      realizadoSemana,
      total: totalSims,
      mediaPontuacao,
      piorMateria: piorMateria ?? null,
    },
    ranking,
    historico,
  })
}
