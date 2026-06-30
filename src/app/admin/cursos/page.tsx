"use client"

import Link from "next/link"
import { motion } from "framer-motion"

const cursos = [
  { id: "1", titulo: "Direito Constitucional para Concursos", area: "Concursos", modulos: 8, aulas: 42, minutos: 840, publicado: true },
  { id: "2", titulo: "OAB 1ª Fase — Direito Civil", area: "OAB", modulos: 6, aulas: 28, minutos: 560, publicado: true },
  { id: "3", titulo: "Matemática para Concursos Militares", area: "Militar", modulos: 5, aulas: 35, minutos: 525, publicado: false },
  { id: "4", titulo: "Redação ENEM Nota 1000", area: "ENEM", modulos: 4, aulas: 16, minutos: 320, publicado: true },
  { id: "5", titulo: "Português Completo", area: "Concursos", modulos: 10, aulas: 55, minutos: 1100, publicado: true },
  { id: "6", titulo: "Direito Administrativo Esquematizado", area: "Concursos", modulos: 7, aulas: 31, minutos: 620, publicado: false },
]

export default function AdminCursosPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Cursos</h1>
          <span className="text-xs text-muted font-mono">{cursos.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cursos.map((curso, idx) => (
          <motion.div
            key={curso.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card overflow-hidden group hover:border-accent/30 transition-colors"
          >
            <div className="h-32 bg-gradient-to-br from-[#CBFF4D20] to-[#111111] flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent text-lg font-bold flex items-center justify-center">
                {curso.titulo[0]}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="text-sm text-foreground font-medium leading-tight">{curso.titulo}</div>
                <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-1.5 inline-block">{curso.area}</span>
              </div>
              <div className="text-xs text-muted font-mono">
                {curso.modulos} módulos · {curso.aulas} aulas · {curso.minutos}min
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  curso.publicado
                    ? "text-green-400 bg-green-400/10 border border-green-400/30"
                    : "text-muted bg-[#2A2A2A]/50 border border-[#2A2A2A]"
                }`}>
                  {curso.publicado ? "PUBLICADO" : "RASCUNHO"}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/cursos/${curso.id}`}
                    className="text-[11px] text-accent hover:underline font-medium"
                  >
                    EDITAR
                  </Link>
                  <button className="text-[11px] text-muted hover:text-foreground">
                    {curso.publicado ? "DESPUBLICAR" : "PUBLICAR"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
