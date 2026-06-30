"use client"

import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const weekData = [
  { dia: "DOM", questoes: 142 },
  { dia: "SEG", questoes: 287 },
  { dia: "TER", questoes: 354 },
  { dia: "QUA", questoes: 412 },
  { dia: "QUI", questoes: 298 },
  { dia: "SEX", questoes: 0 },
  { dia: "SAB", questoes: 0 },
]

const areaData = [
  { area: "Concursos", valor: 58, cor: "#CBFF4D" },
  { area: "OAB", valor: 22, cor: "#888888" },
  { area: "Militar", valor: 12, cor: "#FFFFFF30" },
  { area: "ENEM", valor: 8, cor: "#F0F0A8" },
]

const recentUsers = [
  { id: "1", nome: "Carlos Silva", area: "Concursos", plano: "ativo" as const, cadastro: "28/06/2026" },
  { id: "2", nome: "Ana Beatriz", area: "OAB", plano: "trial" as const, cadastro: "27/06/2026" },
  { id: "3", nome: "João Pereira", area: "Militar", plano: "ativo" as const, cadastro: "27/06/2026" },
  { id: "4", nome: "Marina Costa", area: "ENEM", plano: "inativo" as const, cadastro: "26/06/2026" },
  { id: "5", nome: "Rafael Oliveira", area: "Concursos", plano: "ativo" as const, cadastro: "25/06/2026" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 shadow-lg">
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

export default function AdminDashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* LINHA 1 — 4 métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemAnim}>
          <MetricCard label="/ ALUNOS ATIVOS" value="1.247" variacao="+23 esta semana" variacaoPositiva>
            <div className="flex items-end gap-[2px] h-8">
              {weekData.map((d, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{ height: `${(d.questoes / 412) * 100}%`, background: "#CBFF4D30", minHeight: d.questoes ? 4 : 0 }}
                />
              ))}
            </div>
          </MetricCard>
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ RECEITA MENSAL" value="R$ 18.247" variacao="+12% vs mês anterior" variacaoPositiva>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-green-400 font-mono border border-green-400/30 bg-green-400/10 px-2 py-0.5 rounded-full">
              MRR
            </div>
          </MetricCard>
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ QUESTÕES RESOLVIDAS" value="1.493" variacao="+8% hoje">
            <div className="text-xs text-muted font-mono">Total geral: 84.721</div>
          </MetricCard>
        </motion.div>
        <motion.div variants={itemAnim}>
          <MetricCard label="/ TAXA DE ACERTO MÉDIA" value="67%" variacao="↑ 3% vs semana passada" variacaoPositiva />
        </motion.div>
      </div>

      {/* LINHA 2 — Gráfico + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <motion.div variants={itemAnim} className="lg:col-span-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5">
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

        <motion.div variants={itemAnim} className="lg:col-span-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5">
          <div className="text-[11px] text-muted font-mono mb-4">/ DISTRIBUIÇÃO POR ÁREA</div>
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
        </motion.div>
      </div>

      {/* LINHA 3 — Últimos cadastros */}
      <motion.div variants={itemAnim} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card">
        <div className="text-[11px] text-muted font-mono px-5 pt-4 pb-2">/ ÚLTIMOS CADASTROS</div>
        <AdminTable
          columns={[
            { key: "nome", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.nome}</span> },
            { key: "area", header: "ÁREA" },
            { key: "plano", header: "STATUS", render: (row) => <StatusBadge status={row.plano} /> },
            { key: "cadastro", header: "CADASTRO", render: (row) => <span className="text-muted font-mono text-xs">{row.cadastro}</span> },
            {
              key: "acoes",
              header: "AÇÕES",
              render: () => (
                <div className="flex items-center gap-2">
                  <button className="text-muted hover:text-foreground transition-colors" title="Ver perfil">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button className="text-muted hover:text-red-400 transition-colors" title="Suspender">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                </div>
              ),
            },
          ]}
          data={recentUsers}
        />
      </motion.div>
    </motion.div>
  )
}
