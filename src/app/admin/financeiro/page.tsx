"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"
import { StatusBadge } from "@/components/admin/StatusBadge"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const revenueData = [
  { mes: "Jul/25", receita: 12400, churn: 4.2 },
  { mes: "Ago/25", receita: 13100, churn: 3.8 },
  { mes: "Set/25", receita: 12800, churn: 5.1 },
  { mes: "Out/25", receita: 14200, churn: 3.2 },
  { mes: "Nov/25", receita: 15300, churn: 2.9 },
  { mes: "Dez/25", receita: 14800, churn: 3.5 },
  { mes: "Jan/26", receita: 16200, churn: 2.8 },
  { mes: "Fev/26", receita: 17100, churn: 2.5 },
  { mes: "Mar/26", receita: 16500, churn: 3.1 },
  { mes: "Abr/26", receita: 17800, churn: 2.2 },
  { mes: "Mai/26", receita: 18900, churn: 2.0 },
  { mes: "Jun/26", receita: 18247, churn: 2.4 },
]

const subscriptions = [
  { id: "1", aluno: "Carlos Silva", email: "carlos@email.com", plano: "ANUAL", valor: 89.90, forma: "PIX", compra: "15/03/2026", vencimento: "15/03/2027", status: "ativo" as const },
  { id: "2", aluno: "Ana Beatriz", email: "ana@email.com", plano: "ANUAL", valor: 89.90, forma: "Cartão", compra: "02/01/2026", vencimento: "02/01/2027", status: "ativo" as const },
  { id: "3", aluno: "João Pereira", email: "joao@email.com", plano: "TRIAL", valor: 0, forma: "—", compra: "20/06/2026", vencimento: "20/07/2026", status: "aguardando" as const },
  { id: "4", aluno: "Marina Costa", email: "marina@email.com", plano: "ANUAL", valor: 89.90, forma: "Boleto", compra: "10/04/2026", vencimento: "10/04/2027", status: "cancelado" as const },
  { id: "5", aluno: "Rafael Oliveira", email: "rafael@email.com", plano: "ANUAL", valor: 89.90, forma: "Cartão", compra: "08/02/2026", vencimento: "08/02/2027", status: "ativo" as const },
  { id: "6", aluno: "Fernanda Alves", email: "fernanda@email.com", plano: "ANUAL", valor: 89.90, forma: "PIX", compra: "01/05/2026", vencimento: "01/05/2027", status: "reembolsado" as const },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted font-mono mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color || "#CBFF4D" }}>
            {p.name === "receita" ? `Receita: R$ ${p.value.toLocaleString()}` : `Churn: ${p.value}%`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function AdminFinanceiroPage() {
  const [reembolsarId, setReembolsarId] = useState<string | null>(null)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Financeiro</h1>
        <button className="text-xs border border-[#2A2A2A] text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          EXPORTAR CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="MRR" value="R$ 18.247" variacao="+3.2% vs mês anterior" />
        <MetricCard label="ASSINANTES ATIVOS" value="847" variacao="+12 esta semana" />
        <MetricCard label="CHURN RATE" value="2,4%" variacao="▼ acima de 5% é alerta" variacaoPositiva={false} />
        <MetricCard label="TICKET MÉDIO" value="R$ 89,90" />
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5">
        <div className="text-[11px] text-muted font-mono mb-4">/ RECEITA · ÚLTIMOS 12 MESES</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData}>
            <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />
            <XAxis dataKey="mes" stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#444444" tick={{ fill: "#888888", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="receita" stroke="#CBFF4D" strokeWidth={2} dot={{ fill: "#CBFF4D", r: 3 }} />
            <Line type="monotone" dataKey="churn" stroke="#888888" strokeWidth={1.5} dot={{ fill: "#888888", r: 2 }} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <span className="text-[11px] text-muted font-mono">/ ASSINATURAS</span>
          <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-2 py-1 text-[11px] text-muted focus:outline-none focus:border-accent">
            <option>Todos os status</option>
            <option>Ativo</option>
            <option>Aguardando</option>
            <option>Cancelado</option>
            <option>Reembolsado</option>
          </select>
        </div>
        <AdminTable
          columns={[
            {
              key: "aluno",
              header: "ALUNO",
              render: (row) => (
                <div>
                  <div className="text-sm text-foreground">{row.aluno}</div>
                  <div className="text-[11px] text-muted">{row.email}</div>
                </div>
              ),
            },
            { key: "plano", header: "PLANO" },
            { key: "valor", header: "VALOR", render: (row) => <span className="font-mono text-sm">R$ {row.valor.toFixed(2).replace(".", ",")}</span> },
            { key: "forma", header: "FORMA PGTO" },
            { key: "compra", header: "COMPRA", render: (row) => <span className="font-mono text-xs text-muted">{row.compra}</span> },
            { key: "vencimento", header: "VENCIMENTO", render: (row) => <span className="font-mono text-xs text-muted">{row.vencimento}</span> },
            { key: "status", header: "STATUS", render: (row) => <StatusBadge status={row.status} /> },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <div className="flex items-center gap-2">
                  {row.status !== "reembolsado" && row.status !== "cancelado" && (
                    <button
                      onClick={() => setReembolsarId(row.id)}
                      className="text-[11px] text-red-400 hover:underline"
                    >
                      REEMBOLSAR
                    </button>
                  )}
                  <button className="text-[11px] text-muted hover:text-foreground">RECIBO</button>
                </div>
              ),
            },
          ]}
          data={subscriptions}
        />
      </div>

      <ConfirmModal
        open={!!reembolsarId}
        title="Reembolsar assinatura"
        description="Tem certeza que deseja reembolsar esta assinatura? Esta ação não pode ser desfeita."
        confirmLabel="REEMBOLSAR"
        confirmDestructive
        onConfirm={() => setReembolsarId(null)}
        onCancel={() => setReembolsarId(null)}
      />
    </motion.div>
  )
}
