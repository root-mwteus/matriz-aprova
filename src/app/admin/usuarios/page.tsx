"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AdminTable } from "@/components/admin/AdminTable"
import { StatusBadge } from "@/components/admin/StatusBadge"

const students = [
  { id: "1", nome: "Carlos Silva", email: "carlos@email.com", area: "Concursos", concurso: "INSS", streak: 18, progresso: 37, plano: "ativo" as const, cadastro: "15/03/2026" },
  { id: "2", nome: "Ana Beatriz Santos", email: "ana@email.com", area: "OAB", concurso: "Exame OAB", streak: 42, progresso: 71, plano: "ativo" as const, cadastro: "02/01/2026" },
  { id: "3", nome: "João Pereira Lima", email: "joao@email.com", area: "Militar", concurso: "EsPCEx", streak: 0, progresso: 12, plano: "trial" as const, cadastro: "20/06/2026" },
  { id: "4", nome: "Marina Costa", email: "marina@email.com", area: "ENEM", concurso: "ENEM 2026", streak: 5, progresso: 45, plano: "inativo" as const, cadastro: "10/04/2026" },
  { id: "5", nome: "Rafael Oliveira", email: "rafael@email.com", area: "Concursos", concurso: "Receita Federal", streak: 23, progresso: 89, plano: "ativo" as const, cadastro: "08/02/2026" },
  { id: "6", nome: "Fernanda Alves", email: "fernanda@email.com", area: "OAB", concurso: "Exame OAB", streak: 7, progresso: 34, plano: "ativo" as const, cadastro: "01/05/2026" },
]

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
  const colors = ["#CBFF4D", "#F0F0A8", "#FF8C42", "#4DCBFF", "#A84DFF", "#FF4D8C"]
  const idx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `${colors[idx % colors.length]}22`, color: colors[idx % colors.length] }}
    >
      {initials}
    </div>
  )
}

export default function AdminUsuariosPage() {
  const [page, setPage] = useState(1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Usuários</h1>
          <span className="text-xs text-muted font-mono">{students.length}</span>
        </div>
        <button className="text-xs border border-[#2A2A2A] text-muted hover:text-foreground px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          EXPORTAR CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="flex-1 min-w-[200px] bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por nome ou email..."
        />
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>Todas as áreas</option>
          <option>Concursos</option>
          <option>OAB</option>
          <option>Militar</option>
          <option>ENEM</option>
        </select>
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>Todos os status</option>
          <option>Ativo</option>
          <option>Trial</option>
          <option>Inativo</option>
          <option>Suspenso</option>
        </select>
        <select className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent">
          <option>Mais recentes</option>
          <option>Mais antigos</option>
          <option>Maior progresso</option>
          <option>Menor progresso</option>
        </select>
        <button className="bg-accent/20 text-accent border border-accent/40 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-accent/30 transition-colors">
          FILTRAR
        </button>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card overflow-hidden">
        <AdminTable
          columns={[
            {
              key: "aluno",
              header: "ALUNO",
              render: (row) => (
                <Link href={`/admin/usuarios/${row.id}`} className="flex items-center gap-3 group">
                  <AvatarInitials name={row.nome} />
                  <div>
                    <div className="text-sm text-foreground group-hover:text-accent transition-colors">{row.nome}</div>
                    <div className="text-[11px] text-muted">{row.email}</div>
                  </div>
                </Link>
              ),
            },
            {
              key: "area",
              header: "ÁREA · CONCURSO",
              render: (row) => (
                <div>
                  <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">{row.area}</span>
                  <div className="text-[11px] text-muted mt-0.5">{row.concurso}</div>
                </div>
              ),
            },
            {
              key: "streak",
              header: "STREAK",
              render: (row) => (
                <span className={`text-xs font-mono ${row.streak > 0 ? "text-foreground" : "text-muted"}`}>
                  {row.streak > 0 ? `🔥 ${row.streak} dias` : "— sem streak"}
                </span>
              ),
            },
            {
              key: "progresso",
              header: "PROGRESSO",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden max-w-[80px]">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${row.progresso}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted">{row.progresso}%</span>
                </div>
              ),
            },
            { key: "plano", header: "PLANO", render: (row) => <StatusBadge status={row.plano} /> },
            {
              key: "cadastro",
              header: "CADASTRO",
              render: (row) => <span className="text-xs text-muted font-mono">{row.cadastro}</span>,
            },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <Link href={`/admin/usuarios/${row.id}`} className="text-[11px] text-accent hover:underline">VER</Link>
                  <span className="text-muted text-[11px]">|</span>
                  <a href={`mailto:${row.email}`} className="text-[11px] text-muted hover:text-foreground">EMAIL</a>
                  <span className="text-muted text-[11px]">|</span>
                  <button className="text-[11px] text-red-400 hover:underline">SUSPENDER</button>
                </div>
              ),
            },
          ]}
          data={students}
          page={page}
          total={48}
          onPageChange={setPage}
        />
      </div>
    </motion.div>
  )
}
