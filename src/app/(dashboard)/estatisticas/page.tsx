"use client"

import { useEffect, useState } from "react"
import PageHeader from "@/components/PageHeader"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]

interface Resposta {
  correto: boolean
  tempo_segundos: number | null
  created_at: string
  questions: { materia: string } | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-card-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-foreground font-medium">{label}</p>
        <p className="text-xs text-accent">{payload[0].value}{payload[0].unit || ""}</p>
      </div>
    )
  }
  return null
}

function formatarTempo(segundos: number) {
  const min = Math.floor(segundos / 60)
  const seg = Math.round(segundos % 60)
  return min > 0 ? `${min}m ${seg}s` : `${seg}s`
}

export default function EstatisticasPage() {
  const [loading, setLoading] = useState(true)
  const [respostas, setRespostas] = useState<Resposta[]>([])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("user_answers")
        .select("correto, tempo_segundos, created_at, questions(materia)")
        .eq("user_id", user.id)

      if (!active) return
      setRespostas((data as unknown as Resposta[]) || [])
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [])

  const temDados = respostas.length > 0

  // Desempenho por matéria
  const porMateria = new Map<string, { total: number; corretas: number }>()
  respostas.forEach((r) => {
    const materia = r.questions?.materia || "Outras"
    const atual = porMateria.get(materia) || { total: 0, corretas: 0 }
    atual.total += 1
    if (r.correto) atual.corretas += 1
    porMateria.set(materia, atual)
  })
  const desempenhoData = Array.from(porMateria.entries())
    .map(([materia, { total, corretas }]) => ({
      materia,
      pct: Math.round((corretas / total) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)

  // Evolução semanal
  const hoje = new Date()
  const dias: { date: Date; dia: string; questoes: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(d.getDate() - i)
    dias.push({ date: d, dia: DIAS_SEMANA[d.getDay()], questoes: 0 })
  }
  respostas.forEach((r) => {
    const dataResposta = new Date(r.created_at)
    const dia = dias.find((d) => d.date.toDateString() === dataResposta.toDateString())
    if (dia) dia.questoes += 1
  })
  const semanalData = dias.map(({ dia, questoes }) => ({ dia, questoes }))

  // Taxa de acerto
  const totalCorretas = respostas.filter((r) => r.correto).length
  const taxaAcerto = temDados ? Math.round((totalCorretas / respostas.length) * 100) : 0
  const acertoData = [
    { tipo: "Corretas", valor: totalCorretas },
    { tipo: "Erradas", valor: respostas.length - totalCorretas },
  ]

  // Tempo médio
  const comTempo = respostas.filter((r) => r.tempo_segundos != null)
  const tempoMedioGeral = comTempo.length
    ? comTempo.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) / comTempo.length
    : 0
  const tempoPorMateria = new Map<string, { total: number; soma: number }>()
  comTempo.forEach((r) => {
    const materia = r.questions?.materia || "Outras"
    const atual = tempoPorMateria.get(materia) || { total: 0, soma: 0 }
    atual.total += 1
    atual.soma += r.tempo_segundos || 0
    tempoPorMateria.set(materia, atual)
  })
  const tempoData = Array.from(tempoPorMateria.entries())
    .map(([materia, { total, soma }]) => ({ materia, media: soma / total }))
    .sort((a, b) => a.media - b.media)

  function EmptyState() {
    return (
      <div className="flex items-center justify-center h-48 text-muted text-sm">
        Resolva questões para gerar gráficos
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        badge="ESTATÍSTICAS"
        title="Sua evolução detalhada"
        subtitle="Acompanhe seu desempenho em todas as matérias"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-4">
            DESEMPENHO POR MATÉRIA
          </h2>
          {loading ? <EmptyState /> : !temDados ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={desempenhoData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="materia" stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pct" fill="#CBFF4D" radius={[0, 4, 4, 0]} unit="%" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-4">
            EVOLUÇÃO SEMANAL
          </h2>
          {loading ? <EmptyState /> : !temDados ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={semanalData}>
                <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
                <XAxis dataKey="dia" stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="questoes" fill="#CBFF4D" radius={[4, 4, 0, 0]} maxBarSize={32} unit=" questões" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-4">
            TAXA DE ACERTO
          </h2>
          {loading ? <EmptyState /> : !temDados ? <EmptyState /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={acertoData} dataKey="valor" nameKey="tipo" cx="50%" cy="50%" innerRadius={45} outerRadius={65} stroke="none">
                    <Cell fill="#CBFF4D" />
                    <Cell fill="#2A2A2A" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div>
                <div className="text-3xl font-bold text-foreground">{taxaAcerto}%</div>
                <div className="text-xs text-muted mt-1">{totalCorretas} de {respostas.length} questões</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted mb-4">
            TEMPO MÉDIO
          </h2>
          {loading ? <EmptyState /> : !temDados || comTempo.length === 0 ? <EmptyState /> : (
            <div className="space-y-3">
              <div className="text-3xl font-bold text-foreground">{formatarTempo(tempoMedioGeral)}</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {tempoData.map((t, i) => (
                  <div key={t.materia} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted font-mono">{String(i + 1).padStart(2, "0")} · {t.materia}</span>
                    <span className="text-foreground font-medium">{formatarTempo(t.media)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
