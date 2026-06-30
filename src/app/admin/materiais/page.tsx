"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const materiais = [
  { id: "1", titulo: "Direito Constitucional Esquematizado", materia: "Direito Constitucional", banca: "CESPE", professor: "Prof. André Castro", paginas: 47, incidencia: 87, downloads: 342, ia: true },
  { id: "2", titulo: "Gramática Completa para Concursos", materia: "Português", banca: "FGV", professor: "Profa. Maria Santos", paginas: 92, incidencia: 72, downloads: 281, ia: false },
  { id: "3", titulo: "Matemática Financeira — Resumo", materia: "Matemática", banca: "VUNESP", professor: "Prof. Ricardo Lopes", paginas: 23, incidencia: 65, downloads: 198, ia: true },
  { id: "4", titulo: "Lei 8.112/90 Comentada", materia: "Direito Administrativo", banca: "FCC", professor: "Prof. Carla Mendes", paginas: 156, incidencia: 93, downloads: 415, ia: true },
  { id: "5", titulo: "Informática — Word e Excel", materia: "Informática", banca: "CESPE", professor: "Prof. Tiago Alves", paginas: 34, incidencia: 55, downloads: 167, ia: false },
  { id: "6", titulo: "Raciocínio Lógico — Questões Comentadas", materia: "Raciocínio Lógico", banca: "IBFC", professor: "Prof. João Neto", paginas: 68, incidencia: 78, downloads: 223, ia: false },
]

export default function AdminMateriaisPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Materiais · PDF</h1>
          <span className="text-xs text-muted font-mono">{materiais.length}</span>
        </div>
        <Link
          href="/admin/materiais/novo"
          className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
        >
          NOVO MATERIAL →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materiais.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-4 hover:border-accent/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground font-medium leading-tight truncate">{m.titulo}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">{m.materia}</span>
                  <span className="text-[10px] text-muted bg-[#2A2A2A] px-1.5 py-0.5 rounded-full">{m.banca}</span>
                  <span className="text-[10px] text-muted bg-[#2A2A2A] px-1.5 py-0.5 rounded-full">{m.professor}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="text-[11px] text-muted font-mono">📄 {m.paginas} páginas</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${m.incidencia}%` }} />
                </div>
                <span className="text-[11px] text-muted font-mono">{m.incidencia}% CAI NA BANCA</span>
              </div>
              {m.ia && (
                <span className="inline-flex items-center text-[10px] text-accent bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full">
                  IA RECOMENDA
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2A2A2A]">
              <span className="text-[11px] text-muted font-mono">{m.downloads} downloads</span>
              <div className="flex items-center gap-2">
                <button className="text-muted hover:text-foreground transition-colors" title="Editar">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button className="text-muted hover:text-red-400 transition-colors" title="Excluir">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
