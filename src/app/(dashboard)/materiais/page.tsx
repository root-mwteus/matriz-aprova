"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Material } from "@/types"
import PageHeader from "@/components/PageHeader"

type Ordenacao = "incidencia" | "materia" | "recentes"
type FiltroIA = "todos" | "ia"

const materiasList = [
  "Português", "Matemática", "Direito Constitucional", "Direito Administrativo",
  "Informática", "Raciocínio Lógico", "História", "Geografia",
  "Atualidades", "Legislação", "Direito Penal", "Direito Civil",
]

const bancasList = [
  "CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC",
  "CONSULPLAN", "QUADRIX", "CESGRANRIO",
]

export default function MateriaisPage() {
  const supabase = createClient()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [materia, setMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [professor, setProfessor] = useState("")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("incidencia")
  const [filtroIA, setFiltroIA] = useState<FiltroIA>("todos")

  useEffect(() => {
    async function load() {
      let query = supabase.from("materials").select("*")

      if (materia) query = query.eq("materia", materia)
      if (banca) query = query.eq("banca", banca)
      if (professor) query = query.ilike("professor", `%${professor}%`)
      if (filtroIA === "ia") query = query.gt("incidencia_pct", 70)

      if (ordenacao === "incidencia") query = query.order("incidencia_pct", { ascending: false, nullsFirst: false })
      else if (ordenacao === "materia") query = query.order("materia", { ascending: true })
      else query = query.order("created_at", { ascending: false })

      const { data } = await query
      if (data) setMateriais(data)
      setLoading(false)
    }
    load()
  }, [supabase, materia, banca, professor, ordenacao, filtroIA])

  const handleDownload = useCallback(async (url: string | null, titulo: string) => {
    if (!url) return
    const supabase = createClient()
    const { data, error } = await supabase.storage.from("materiais").createSignedUrl(url, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank")
    } else {
      console.error("Erro ao gerar URL do material:", error)
      toast.error(`Não foi possível abrir "${titulo}"`)
    }
  }, [])

  const professores = Array.from(new Set(materiais.map((m) => m.professor).filter(Boolean))) as string[]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <PageHeader
          badge="MATERIAIS"
          title="PDFs selecionados pela IA"
          subtitle="Materiais com maior incidência na sua banca"
        />
        <span className="text-sm text-muted font-mono mt-1">
          {materiais.length} disponíveis
        </span>
      </div>

      {/* FILTROS */}
      <div className="bg-card border border-card-border rounded-card p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Matéria</option>
            {materiasList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={banca}
            onChange={(e) => setBanca(e.target.value)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Banca</option>
            {bancasList.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Professor</option>
            {professores.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="incidencia">Incidência</option>
            <option value="materia">Matéria</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltroIA("todos")}
            className={`px-4 py-2 rounded-card text-xs font-semibold transition-all ${
              filtroIA === "todos"
                ? "bg-accent text-accent-foreground font-bold"
                : "bg-background border border-card-border text-muted hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroIA("ia")}
            className={`px-4 py-2 rounded-card text-xs font-semibold transition-all ${
              filtroIA === "ia"
                ? "bg-accent text-accent-foreground font-bold"
                : "bg-background border border-card-border text-muted hover:text-foreground"
            }`}
          >
            Sugeridos pela IA
          </button>
          {filtroIA === "ia" && (
            <span className="text-[10px] text-muted font-mono">
              incidência &gt; 70%
            </span>
          )}
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted text-sm animate-pulse">Carregando materiais...</div>
        </div>
      ) : materiais.length === 0 ? (
        <div className="bg-card border border-card-border rounded-card p-10 text-center space-y-3">
          <span className="text-4xl">📚</span>
          <p className="text-sm text-muted">Nenhum material encontrado.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materiais.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-card-border rounded-card p-5 hover:border-accent/30 transition-all group flex flex-col"
            >
              {(m.incidencia_pct ?? 0) > 70 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-badge-bg text-accent border border-badge-border text-[10px] font-bold font-mono uppercase">
                    IA · {m.incidencia_pct}% CAI
                  </span>
                </div>
              )}

              <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug mb-2">
                {m.titulo}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                {m.materia && (
                  <span className="text-[11px] text-muted">{m.materia}</span>
                )}
                {m.banca && (
                  <>
                    <span className="text-[11px] text-muted">·</span>
                    <span className="text-[11px] text-muted">{m.banca}</span>
                  </>
                )}
              </div>

              <div className="flex-1" />

              <div className="flex items-center justify-between pt-3 border-t border-card-border">
                <span className="text-[11px] text-muted">
                  📄 {m.paginas ?? "--"} páginas{m.professor ? ` · ${m.professor}` : ""}
                </span>
                <button
                  onClick={() => handleDownload(m.pdf_url, m.titulo)}
                  disabled={!m.pdf_url}
                  className="w-8 h-8 rounded-full bg-background border border-card-border flex items-center justify-center hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Baixar material"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
