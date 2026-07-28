"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"

const ranking = [
  { id: "1", aluno: "Ana Beatriz", area: "OAB", pontuacao: 93, simulados: 12, ultima: "28/06/2026" },
  { id: "2", aluno: "Rafael Oliveira", area: "Concursos", pontuacao: 89, simulados: 8, ultima: "27/06/2026" },
  { id: "3", aluno: "Carlos Silva", area: "Concursos", pontuacao: 85, simulados: 15, ultima: "26/06/2026" },
  { id: "4", aluno: "Fernanda Alves", area: "OAB", pontuacao: 78, simulados: 6, ultima: "25/06/2026" },
  { id: "5", aluno: "Marina Costa", area: "ENEM", pontuacao: 72, simulados: 4, ultima: "24/06/2026" },
  { id: "6", aluno: "João Pereira", area: "Militar", pontuacao: 65, simulados: 3, ultima: "22/06/2026" },
]

const historico = [
  { id: "1", aluno: "Ana Beatriz", banca: "FGV", questoes: 30, acertos: 28, pct: 93, tempo: "01:52:34", data: "28/06/2026" },
  { id: "2", aluno: "Rafael Oliveira", banca: "CESPE", questoes: 30, acertos: 26, pct: 87, tempo: "02:10:15", data: "27/06/2026" },
  { id: "3", aluno: "Carlos Silva", banca: "VUNESP", questoes: 20, acertos: 17, pct: 85, tempo: "01:20:45", data: "26/06/2026" },
  { id: "4", aluno: "Fernanda Alves", banca: "FCC", questoes: 30, acertos: 23, pct: 77, tempo: "02:05:10", data: "25/06/2026" },
  { id: "5", aluno: "Marina Costa", banca: "ENEM", questoes: 20, acertos: 14, pct: 70, tempo: "01:45:00", data: "24/06/2026" },
  { id: "6", aluno: "João Pereira", banca: "IBFC", questoes: 10, acertos: 6, pct: 60, tempo: "00:50:22", data: "22/06/2026" },
]

function Medal({ pos }: { pos: number }) {
  const medals = ["🥇", "🥈", "🥉"]
  return pos <= 3 ? <span>{medals[pos - 1]}</span> : <span className="text-muted font-mono">{pos}</span>
}

export default function AdminSimuladosPage() {
  const [page, setPage] = useState(1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-xl font-semibold text-fg">Simulados</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="REALIZADOS HOJE/SEMANA/TOTAL" value="12 / 84 · 1.247" />
        <MetricCard label="MÉDIA DE PONTUAÇÃO" value="72%" />
        <MetricCard label="PIOR MATÉRIA" value="Matemática" variacao="42% de acertos — refaça o plano" variacaoPositiva={false} />
      </div>

      <div className="bg-card border border-card-border rounded-card">
        <div className="text-[11px] text-muted font-mono px-5 pt-4 pb-2">/ RANKING GERAL</div>
        <AdminTable
          columns={[
            {
              key: "pos",
              header: "POS",
              render: (_row: any, idx: number) => <Medal pos={idx + 1} />,
            },
            { key: "aluno", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.aluno}</span> },
            { key: "area", header: "Área", render: (row) => <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">{row.area}</span> },
            { key: "pontuacao", header: "PONTUAÇÃO", render: (row) => <span className="text-accent font-semibold font-mono">{row.pontuacao}%</span> },
            { key: "simulados", header: "SIMULADOS", render: (row) => <span className="text-muted font-mono">{row.simulados}</span> },
            { key: "ultima", header: "ÚLTIMA PROVA", render: (row) => <span className="text-muted font-mono text-xs">{row.ultima}</span> },
          ]}
          data={ranking}
        />
      </div>

      <div className="bg-card border border-card-border rounded-card">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <span className="text-[11px] text-muted font-mono">/ SIMULADOS REALIZADOS</span>
          <select className="field h-7 w-auto text-xs">
            <option>Todos períodos</option>
            <option>Hoje</option>
            <option>Esta semana</option>
            <option>Este mês</option>
          </select>
          <button className="ml-auto text-xs border border-card-border text-muted hover:text-foreground px-2 py-1 rounded-lg transition-colors">Exportar CSV</button>
        </div>
        <AdminTable
          columns={[
            { key: "aluno", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.aluno}</span> },
            { key: "banca", header: "BANCA" },
            { key: "questoes", header: "Q", render: (row) => <span className="font-mono">{row.questoes}</span> },
            { key: "acertos", header: "ACERTOS", render: (row) => <span className="font-mono">{row.acertos}</span> },
            { key: "pct", header: "%", render: (row) => <span className="font-mono text-accent">{row.pct}%</span> },
            { key: "tempo", header: "TEMPO TOTAL", render: (row) => <span className="font-mono text-xs text-muted">{row.tempo}</span> },
            { key: "data", header: "DATA", render: (row) => <span className="font-mono text-xs text-muted">{row.data}</span> },
          ]}
          data={historico}
          page={page}
          total={historico.length}
          onPageChange={setPage}
        />
      </div>
    </motion.div>
  )
}
