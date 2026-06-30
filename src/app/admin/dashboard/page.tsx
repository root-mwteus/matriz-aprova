"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { createClient } from "@/lib/supabase/client"

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]
const AREA_CORES = ["#CBFF4D", "#888888", "#4DCBFF", "#F0F0A8", "#FF8C42", "#A84DFF"]

interface RecentUser {
  id: string
  nome: string | null
  email: string
  area_concurso: string | null
  created_at: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-[#2A2A2A] rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-foreground font-medium">{label}</p>
        <p className="text-xs text-accent">{payload[0].value} questões</p>
      </div>
    )
  }
  return null
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [totalAlunos, setTotalAlunos] = useState(0)
  const [novosAlunos7d, setNovosAlunos7d] = useState(0)
  const [totalRespostas, setTotalRespostas] = useState(0)
  const [taxaAcerto, setTaxaAcerto] = useState(0)
  const [weekData, setWeekData] = useState<{ dia: string; questoes: number }[]>([])
  const [areaData, setAreaData] = useState<{ area: string; valor: number; cor: string }[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      const hoje = new Date()
      const seteDiasAtras = new Date(hoje)
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6)
      seteDiasAtras.setHours(0, 0, 0, 0)

      const [
        { count: alunosCount },
        { count: novosCount },
        { count: respostasCount },
        { count: corretasCount },
        { data: respostasSemana },
        { data: areaRows },
        { data: recentes },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user").gte("created_at", seteDiasAtras.toISOString()),
        supabase.from("user_answers").select("*", { count: "exact", head: true }),
        supabase.from("user_answers").select("*", { count: "exact", head: true }).eq("correto", true),
        supabase.from("user_answers").select("created_at").gte("created_at", seteDiasAtras.toISOString()),
        supabase.from("profiles").select("area_concurso").eq("role", "user"),
        supabase
          .from("profiles")
          .select("id, nome, email, area_concurso, created_at")
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      if (!active) return

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
      const distribuicao = Array.from(contagemArea.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([area, qtd], i) => ({
          area,
          valor: totalComArea ? Math.round((qtd / totalComArea) * 100) : 0,
          cor: AREA_CORES[i % AREA_CORES.length],
        }))

      setTotalAlunos(alunosCount ?? 0)
      setNovosAlunos7d(novosCount ?? 0)
      setTotalRespostas(respostasCount ?? 0)
      setTaxaAcerto(respostasCount ? Math.round(((corretasCount ?? 0) / respostasCount) * 100) : 0)
      setWeekData(dias.map(({ dia, questoes }) => ({ dia, questoes })))
      setAreaData(distribuicao)
      setRecentUsers(recentes ?? [])
      setLoading(false)
    }

    load().catch((err) => {
      console.error("Erro ao carregar dashboard admin:", err)
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const maxQuestoesSemana = Math.max(1, ...weekData.map((d) => d.questoes))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* LINHA 1 — 4 métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemAnim}>
          <MetricCard
            label="/ ALUNOS CADASTRADOS"
            value={loading ? "—" : totalAlunos.toLocaleString("pt-BR")}
            variacao={loading ? undefined : `+${novosAlunos7d} esta semana`}
            variacaoPositiva
          >
            <div className="flex items-end gap-[2px] h-8">
              {weekData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${(d.questoes / maxQuestoesSemana) * 100}%`, background: "#CBFF4D30", minHeight: d.questoes ? 4 : 0 }}
                />
              ))}
            </div>
          </MetricCard>
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ NOVOS CADASTROS (7 DIAS)" value={loading ? "—" : novosAlunos7d}>
            <div className="text-[11px] text-muted font-mono">Receita: pagamentos ainda não implementados</div>
          </MetricCard>
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ QUESTÕES RESPONDIDAS" value={loading ? "—" : totalRespostas.toLocaleString("pt-BR")} />
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ TAXA DE ACERTO MÉDIA" value={loading ? "—" : `${taxaAcerto}%`} />
        </motion.div>
      </div>

      {/* LINHA 2 — Gráfico + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={itemAnim} className="lg:col-span-3 bg-card border border-[#2A2A2A] rounded-card p-5">
          <div className="text-[11px] text-muted font-mono mb-4">/ ATIVIDADE · ÚLTIMOS 7 DIAS</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
              <XAxis dataKey="dia" stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="questoes" fill="#CBFF4D" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={itemAnim} className="lg:col-span-2 bg-card border border-[#2A2A2A] rounded-card p-5">
          <div className="text-[11px] text-muted font-mono mb-4">/ DISTRIBUIÇÃO POR ÁREA</div>
          {areaData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-muted">Sem dados ainda</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={areaData} dataKey="valor" nameKey="area" cx="50%" cy="50%" innerRadius={45} outerRadius={70} stroke="none">
                    {areaData.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {areaData.map((a) => (
                  <div key={a.area} className="flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: a.cor }} />
                    <span className="text-muted">{a.area}</span>
                    <span className="text-foreground font-medium">{a.valor}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* LINHA 3 — Últimos cadastros */}
      <motion.div variants={itemAnim} className="bg-card border border-[#2A2A2A] rounded-card">
        <div className="text-[11px] text-muted font-mono px-5 pt-4 pb-2">/ ÚLTIMOS CADASTROS</div>
        <AdminTable
          loading={loading}
          columns={[
            { key: "nome", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.nome || row.email}</span> },
            { key: "area_concurso", header: "ÁREA", render: (row) => <span className="text-muted text-xs">{row.area_concurso || "—"}</span> },
            { key: "email", header: "EMAIL", render: (row) => <span className="text-muted font-mono text-xs">{row.email}</span> },
            { key: "created_at", header: "CADASTRO", render: (row) => <span className="text-muted font-mono text-xs">{formatarData(row.created_at)}</span> },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <Link href={`/admin/usuarios/${row.id}`} className="text-[11px] text-accent hover:underline">
                  VER PERFIL
                </Link>
              ),
            },
          ]}
          data={recentUsers}
        />
      </motion.div>
    </motion.div>
  )
}
