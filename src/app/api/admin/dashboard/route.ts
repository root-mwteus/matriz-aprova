import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]
const AREA_CORES = ["#CBFF4D", "#888888", "#4DCBFF", "#F0F0A8", "#FF8C42", "#A84DFF"]

export async function GET() {
  const supabase = await requireAdmin()
  if (!supabase) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }

  const hoje = new Date()
  const seteDiasAtras = new Date(hoje)
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 6)
  seteDiasAtras.setHours(0, 0, 0, 0)

  const [
    { count: alunosCount },
    { count: novosCount },
    { count: respostasCount },
    { count: corretasCount },
    { count: planosCount },
    { count: planosSemanaisCount },
    { count: simuladosCount },
    { data: respostasSemana },
    { data: areaRows },
    { data: recentes },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user").gte("created_at", seteDiasAtras.toISOString()),
    supabase.from("user_answers").select("*", { count: "exact", head: true }),
    supabase.from("user_answers").select("*", { count: "exact", head: true }).eq("correto", true),
    supabase.from("study_plans").select("*", { count: "exact", head: true }),
    supabase.from("planos_estudo").select("*", { count: "exact", head: true }),
    supabase.from("simulations").select("*", { count: "exact", head: true }),
    supabase.from("user_answers").select("created_at").gte("created_at", seteDiasAtras.toISOString()),
    supabase.from("profiles").select("area_concurso").eq("role", "user"),
    supabase
      .from("profiles")
      .select("id, nome, email, area_concurso, created_at")
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const dias: { date: Date; dia: string; questoes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    dias.push({ date: d, dia: DIAS_SEMANA[d.getDay()], questoes: 0 })
  }
  respostasSemana?.forEach((r) => {
    const dataResposta = new Date(r.created_at)
    const bucket = dias.find((d) => d.date.toDateString() === dataResposta.toDateString())
    if (bucket) bucket.questoes += 1
  })

  const contagemArea = new Map<string, number>()
  areaRows?.forEach((r) => {
    const area = r.area_concurso || "Não informado"
    contagemArea.set(area, (contagemArea.get(area) || 0) + 1)
  })
  const totalComArea = areaRows?.length || 0
  const areaData = Array.from(contagemArea.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([area, qtd], i) => ({
      area,
      valor: totalComArea ? Math.round((qtd / totalComArea) * 100) : 0,
      cor: AREA_CORES[i % AREA_CORES.length],
    }))

  return NextResponse.json({
    totalAlunos: alunosCount ?? 0,
    novosAlunos7d: novosCount ?? 0,
    totalRespostas: respostasCount ?? 0,
    totalPlanos: (planosCount ?? 0) + (planosSemanaisCount ?? 0),
    totalSimulados: simuladosCount ?? 0,
    taxaAcerto: respostasCount ? Math.round(((corretasCount ?? 0) / respostasCount) * 100) : 0,
    weekData: dias.map(({ dia, questoes }) => ({ dia, questoes })),
    areaData,
    recentUsers: recentes ?? [],
  })
}
