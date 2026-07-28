"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import PageHeader from "@/components/PageHeader"
import { ErrorState, Panel, Progress, Skeleton, Stat } from "@/components/ui"
import { ChartFrame, ChartTooltip, axisProps, useChartTheme } from "@/components/charts/ChartKit"

/**
 * Estatísticas.
 *
 * Duas mudanças de forma, e as duas por leitura, não por estética:
 *
 * · a rosca de "taxa de acerto" virou número + barra. Uma rosca de duas
 *   fatias pede que o olho compare ângulos para descobrir um percentual
 *   que já estava escrito ao lado — o número sozinho responde antes;
 * · "tempo médio por matéria" era uma lista numerada; virou barra
 *   horizontal, onde a diferença entre matérias aparece no comprimento
 *   em vez de exigir a subtração mental de doze valores.
 *
 * A faixa de números no topo é o resumo; os gráficos abaixo explicam.
 */

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

interface Resposta {
  correto: boolean
  tempo_segundos: number | null
  created_at: string
  questions: { materia: string } | null
}

function formatarTempo(segundos: number) {
  const min = Math.floor(segundos / 60)
  const seg = Math.round(segundos % 60)
  return min > 0 ? `${min}m ${seg}s` : `${seg}s`
}

export default function EstatisticasPage() {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const chart = useChartTheme()

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("user_answers")
          .select("correto, tempo_segundos, created_at, questions(materia)")
          .eq("user_id", user.id)

        if (!active) return
        setRespostas((data as unknown as Resposta[]) || [])
      } catch {
        if (active) setErro("Não foi possível carregar as estatísticas")
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const temDados = respostas.length > 0

  /* ── Desempenho por matéria ─────────────────────────────── */
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
      total,
    }))
    .sort((a, b) => b.pct - a.pct)

  /* ── Últimos 7 dias ─────────────────────────────────────── */
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

  /* ── Agregados ──────────────────────────────────────────── */
  const totalCorretas = respostas.filter((r) => r.correto).length
  const taxaAcerto = temDados ? Math.round((totalCorretas / respostas.length) * 100) : 0

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
    .map(([materia, { total, soma }]) => ({ materia, media: Math.round(soma / total) }))
    .sort((a, b) => a.media - b.media)

  const questoesSemana = semanalData.reduce((a, d) => a + d.questoes, 0)

  if (erro) return <ErrorState description={erro} onRetry={() => window.location.reload()} />

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Estatísticas"
        subtitle="Onde você acerta, onde demora e como está o ritmo."
      />

      {/* ── Resumo ──────────────────────────────────────────── */}
      <Panel flush>
        <div className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2.5 h-6 w-16" />
              </div>
            ))
          ) : (
            <>
              <div className="border-b border-line p-4 md:border-b-0">
                <Stat
                  label="Taxa de acerto"
                  value={`${taxaAcerto}%`}
                  hint={`${totalCorretas} de ${respostas.length}`}
                />
                <Progress
                  value={taxaAcerto}
                  size="sm"
                  tone={taxaAcerto >= 70 ? "positive" : taxaAcerto >= 50 ? "caution" : "negative"}
                  className="mt-3"
                  label={`Taxa de acerto de ${taxaAcerto}%`}
                />
              </div>
              <div className="border-b border-line p-4 md:border-b-0">
                <Stat label="Questões resolvidas" value={respostas.length} hint="no total" />
              </div>
              <div className="p-4">
                <Stat
                  label="Tempo médio"
                  value={comTempo.length ? formatarTempo(tempoMedioGeral) : "—"}
                  hint="por questão"
                />
              </div>
              <div className="p-4">
                <Stat label="Últimos 7 dias" value={questoesSemana} hint="questões na semana" />
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* ── Gráficos ────────────────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartFrame
          title="Desempenho por matéria"
          description="Percentual de acerto, da melhor para a pior"
          loading={loading}
          hasData={desempenhoData.length > 0}
          height={Math.max(200, desempenhoData.length * 28)}
          tableData={desempenhoData.map((d) => ({ label: d.materia, value: `${d.pct}%` }))}
        >
          <ResponsiveContainer width="100%" height={Math.max(200, desempenhoData.length * 28)}>
            <BarChart
              data={desempenhoData}
              layout="vertical"
              margin={{ left: 0, right: 32, top: 4, bottom: 4 }}
              barCategoryGap={6}
            >
              <CartesianGrid stroke={chart.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                type="category"
                dataKey="materia"
                width={132}
                {...axisProps(chart.axis)}
                tick={{ fill: chart.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: chart.track }}
                content={<ChartTooltip formatter={(v) => `${v}% de acerto`} />}
              />
              {/* Barra fina com ponta arredondada; o valor vai direto na
                  ponta, o que dispensa o eixo X inteiro. */}
              <Bar dataKey="pct" fill={chart.series[0]} radius={[0, 4, 4, 0]} barSize={12} unit="%">
                <LabelList
                  dataKey="pct"
                  position="right"
                  offset={8}
                  className="fill-fg-subtle"
                  fontSize={11}
                  formatter={(v: number) => `${v}%`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Ritmo dos últimos 7 dias"
          description="Questões respondidas por dia"
          loading={loading}
          hasData={temDados}
          tableData={semanalData.map((d) => ({ label: d.dia, value: String(d.questoes) }))}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={semanalData} margin={{ left: -20, right: 4, top: 8, bottom: 0 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="dia" {...axisProps(chart.axis)} />
              <YAxis allowDecimals={false} width={36} {...axisProps(chart.axis)} />
              <Tooltip
                cursor={{ fill: chart.track }}
                content={<ChartTooltip formatter={(v) => `${v} ${v === 1 ? "questão" : "questões"}`} />}
              />
              <Bar dataKey="questoes" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {/* O dia de hoje fica cheio; os anteriores, esmaecidos —
                    a barra mais à direita é sempre parcial e comparar
                    com as fechadas induz erro. */}
                {semanalData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={chart.series[0]}
                    fillOpacity={i === semanalData.length - 1 ? 1 : 0.65}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>

        <ChartFrame
          title="Tempo médio por matéria"
          description="Da mais rápida para a mais demorada"
          loading={loading}
          hasData={tempoData.length > 0}
          emptyMessage="Ainda não há tempo registrado nas suas respostas"
          height={Math.max(200, tempoData.length * 28)}
          tableData={tempoData.map((t) => ({ label: t.materia, value: formatarTempo(t.media) }))}
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={Math.max(200, tempoData.length * 28)}>
            <BarChart
              data={tempoData}
              layout="vertical"
              margin={{ left: 0, right: 56, top: 4, bottom: 4 }}
              barCategoryGap={6}
            >
              <CartesianGrid stroke={chart.grid} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="materia"
                width={132}
                {...axisProps(chart.axis)}
                tick={{ fill: chart.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: chart.track }}
                content={<ChartTooltip formatter={(v) => formatarTempo(v)} />}
              />
              <Bar dataKey="media" fill={chart.series[0]} radius={[0, 4, 4, 0]} barSize={12}>
                <LabelList
                  dataKey="media"
                  position="right"
                  offset={8}
                  className="fill-fg-subtle"
                  fontSize={11}
                  formatter={(v: number) => formatarTempo(v)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </div>
    </div>
  )
}
