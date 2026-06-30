"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

const tabs = ["INFORMAÇÕES", "CONTEÚDO"]

interface Aula {
  id: string
  titulo: string
  duracao: string
}

interface Modulo {
  id: string
  titulo: string
  aulas: Aula[]
}

const initialModulos: Modulo[] = [
  {
    id: "m1",
    titulo: "Módulo 01 — Princípios Constitucionais",
    aulas: [
      { id: "a1", titulo: "Introdução aos Princípios", duracao: "12:34" },
      { id: "a2", titulo: "Princípio da Legalidade", duracao: "08:21" },
    ],
  },
  {
    id: "m2",
    titulo: "Módulo 02 — Atos Administrativos",
    aulas: [],
  },
]

export default function CursoEditorPage() {
  const params = useParams()
  const [tab, setTab] = useState("CONTEÚDO")
  const [modulos, setModulos] = useState(initialModulos)
  const [editAula, setEditAula] = useState<{ moduloId: string; aula: Aula } | null>(null)
  const [editModuloTitulo, setEditModuloTitulo] = useState<string | null>(null)

  function addModulo() {
    const idx = modulos.length + 1
    setModulos([...modulos, { id: `m${Date.now()}`, titulo: `Módulo ${String(idx).padStart(2, "0")} — Novo Módulo`, aulas: [] }])
  }

  function addAula(moduloId: string) {
    const aula: Aula = { id: `a${Date.now()}`, titulo: "Nova Aula", duracao: "00:00" }
    setModulos(modulos.map((m) => m.id === moduloId ? { ...m, aulas: [...m.aulas, aula] } : m))
    setEditAula({ moduloId, aula })
  }

  function saveAula(moduloId: string, aulaId: string, titulo: string, duracao: string) {
    setModulos(modulos.map((m) =>
      m.id === moduloId
        ? { ...m, aulas: m.aulas.map((a) => a.id === aulaId ? { ...a, titulo, duracao } : a) }
        : m
    ))
    setEditAula(null)
  }

  function deleteModulo(id: string) {
    setModulos(modulos.filter((m) => m.id !== id))
  }

  function deleteAula(moduloId: string, aulaId: string) {
    setModulos(modulos.map((m) =>
      m.id === moduloId ? { ...m, aulas: m.aulas.filter((a) => a.id !== aulaId) } : m
    ))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Editar Curso</h1>
        </div>
        <Link href="/admin/cursos" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="flex border-b border-[#2A2A2A] mb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-mono px-4 py-3 border-b-2 transition-colors ${
              tab === t ? "text-accent border-accent" : "text-muted border-transparent hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "INFORMAÇÕES" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Título do Curso</label>
            <input
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
              defaultValue="Direito Constitucional para Concursos"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Área</label>
            <select className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
              <option>Concursos</option>
              <option>OAB</option>
              <option>Militar</option>
              <option>ENEM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Descrição</label>
            <textarea
              rows={4}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent resize-y"
              defaultValue="Curso completo de Direito Constitucional para concursos públicos. Aborda teoria, jurisprudência e questões comentadas."
            />
          </div>
          <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
            <label className="text-xs text-muted font-mono">Publicado</label>
            <button className="w-9 h-5 rounded-full bg-accent relative transition-colors">
              <span className="absolute top-0.5 right-[3px] w-4 h-4 bg-white rounded-full" />
            </button>
          </div>
        </div>
      )}

      {tab === "CONTEÚDO" && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5 space-y-4">
          {modulos.map((modulo, mi) => (
            <div key={modulo.id} className="border border-[#2A2A2A] rounded-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#2A2A2A]">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-muted cursor-grab" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                  <input
                    value={editModuloTitulo === modulo.id ? undefined : modulo.titulo}
                    onChange={(e) => {
                      const updated = modulos.map((m) => m.id === modulo.id ? { ...m, titulo: e.target.value } : m)
                      setModulos(updated)
                    }}
                    className="bg-transparent text-sm text-foreground font-medium focus:outline-none focus:text-accent w-full"
                    defaultValue={modulo.titulo}
                  />
                </div>
                <button onClick={() => deleteModulo(modulo.id)} className="text-muted hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-2 space-y-1">
                {modulo.aulas.map((aula) => (
                  <div key={aula.id} className="flex items-center justify-between py-1.5 group/aula">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span
                        className="text-sm text-foreground cursor-pointer hover:text-accent transition-colors"
                        onClick={() => setEditAula({ moduloId: modulo.id, aula })}
                      >
                        {aula.titulo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted font-mono">{aula.duracao}</span>
                      <button onClick={() => deleteAula(modulo.id, aula.id)} className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover/aula:opacity-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addAula(modulo.id)}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1 flex items-center gap-1"
                >
                  + ADICIONAR AULA
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addModulo}
            className="w-full text-sm text-accent border border-dashed border-accent/40 py-3 rounded-lg hover:bg-accent/5 transition-colors"
          >
            + ADICIONAR MÓDULO
          </button>
        </div>
      )}

      {/* Modal de edição de aula */}
      {editAula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000088" }}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-6 w-full max-w-md">
            <h3 className="text-foreground font-bold text-base mb-4">Editar Aula</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Título da Aula</label>
                <input
                  id="edit-aula-titulo"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  defaultValue={editAula.aula.titulo}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">URL do Vídeo</label>
                <input
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Duração</label>
                <input
                  id="edit-aula-duracao"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  defaultValue={editAula.aula.duracao}
                  placeholder="MM:SS"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditAula(null)} className="px-4 py-2 text-sm border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors">
                CANCELAR
              </button>
              <button
                onClick={() => {
                  const tit = (document.getElementById("edit-aula-titulo") as HTMLInputElement)?.value || editAula.aula.titulo
                  const dur = (document.getElementById("edit-aula-duracao") as HTMLInputElement)?.value || editAula.aula.duracao
                  saveAula(editAula.moduloId, editAula.aula.id, tit, dur)
                }}
                className="px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
              >
                SALVAR AULA
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
