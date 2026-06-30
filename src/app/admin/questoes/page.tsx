"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AdminTable } from "@/components/admin/AdminTable"

const mockQuestoes = [
  { id: "1", materia: "Direito Constitucional", banca: "CESPE/CEBRASPE", ano: 2024, enunciado: "Acerca dos princípios fundamentais da Constituição Federal de 1988...", respondidas: 342, pct_acerto: 72 },
  { id: "2", materia: "Português", banca: "FGV", ano: 2023, enunciado: "Assinale a opção em que a concordância verbal está de acordo com a norma padrão...", respondidas: 287, pct_acerto: 58 },
  { id: "3", materia: "Direito Administrativo", banca: "FCC", ano: 2024, enunciado: "No que tange aos atos administrativos, julgue o item a seguir...", respondidas: 198, pct_acerto: 65 },
  { id: "4", materia: "Matemática", banca: "VUNESP", ano: 2024, enunciado: "Um investimento de R$ 10.000,00 rende juros compostos de 1% ao mês...", respondidas: 156, pct_acerto: 43 },
  { id: "5", materia: "Informática", banca: "CESPE/CEBRASPE", ano: 2023, enunciado: "No que se refere aos conceitos de redes de computadores...", respondidas: 221, pct_acerto: 81 },
]

function PctBadge({ value }: { value: number }) {
  const color = value > 70 ? "text-green-400" : value > 40 ? "text-yellow-400" : "text-red-400"
  return <span className={`text-xs font-mono ${color}`}>{value}%</span>
}

export default function AdminQuestoesPage() {
  const [page, setPage] = useState(1)
  const [filtroExplicacao, setFiltroExplicacao] = useState<string>("todas")

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Questões</h1>
          <span className="text-xs text-muted font-mono">1.247</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-xs border border-[#2A2A2A] text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">
            IMPORTAR XLSX
          </button>
          <Link
            href="/admin/questoes/nova"
            className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
          >
            NOVA QUESTÃO →
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="flex-1 min-w-[200px] bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por enunciado..."
        />
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>Todas matérias</option>
          <option>Português</option>
          <option>Matemática</option>
          <option>Direito Constitucional</option>
          <option>Direito Administrativo</option>
          <option>Informática</option>
        </select>
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>Todas bancas</option>
          <option>CESPE/CEBRASPE</option>
          <option>FGV</option>
          <option>VUNESP</option>
          <option>FCC</option>
        </select>
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>2024</option>
          <option>2023</option>
        </select>
        <div className="flex items-center gap-1.5 text-xs text-muted border border-[#2A2A2A] rounded-lg px-2 py-1.5">
          {["todas", "com", "sem"].map((opt) => (
            <button
              key={opt}
              onClick={() => setFiltroExplicacao(opt)}
              className={`px-2 py-0.5 rounded transition-colors ${
                filtroExplicacao === opt ? "bg-accent/20 text-accent" : "hover:text-foreground"
              }`}
            >
              {opt === "todas" ? "Todas" : opt === "com" ? "Com explicação" : "Sem explicação"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card overflow-hidden">
        <AdminTable
          columns={[
            {
              key: "enunciado",
              header: "ENUNCIADO",
              render: (row) => (
                <div className="max-w-[300px]">
                  <span className="text-muted font-mono text-[11px] mr-2">#{row.id}</span>
                  <span className="text-sm text-foreground">{row.enunciado.substring(0, 80)}...</span>
                </div>
              ),
            },
            { key: "materia", header: "MATÉRIA", render: (row) => <span className="text-xs">{row.materia}</span> },
            {
              key: "banca",
              header: "BANCA · ANO",
              render: (row) => <span className="text-xs text-muted font-mono">{row.banca} · {row.ano}</span>,
            },
            { key: "respondidas", header: "RESPONDIDAS", render: (row) => <span className="text-xs text-muted font-mono">{row.respondidas}</span> },
            { key: "pct_acerto", header: "% ACERTO", render: (row) => <PctBadge value={row.pct_acerto} /> },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Link href={`/admin/questoes/${row.id}`} className="text-[11px] text-accent hover:underline">EDITAR</Link>
                  <button className="text-[11px] text-muted hover:text-foreground">PREVIEW</button>
                  <button className="text-[11px] text-red-400 hover:underline">EXCLUIR</button>
                </div>
              ),
            },
          ]}
          data={mockQuestoes}
          page={page}
          total={mockQuestoes.length}
          onPageChange={setPage}
        />
      </div>
    </motion.div>
  )
}
