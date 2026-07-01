"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import PageHeader from "@/components/PageHeader"

interface MateriaCount {
  materia: string
  count: number
}

const materiasList = [
  "Português", "Matemática", "Direito Constitucional", "Direito Administrativo",
  "Informática", "Raciocínio Lógico", "História", "Geografia",
  "Atualidades", "Legislação", "Direito Penal", "Direito Civil",
]

const bancasList = [
  "CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC",
  "CONSULPLAN", "QUADRIX", "CESGRANRIO",
]

const anosList = Array.from({ length: 11 }, (_, i) => String(2026 - i))

export default function QuestoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [materia, setMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [ano, setAno] = useState("")
  const [area, setArea] = useState("")
  const [total, setTotal] = useState(0)
  const [materiaCounts, setMateriaCounts] = useState<MateriaCount[]>([])

  useEffect(() => {
    async function loadCounts() {
      const { count } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
      setTotal(count ?? 0)

      const counts: MateriaCount[] = []
      for (const m of materiasList) {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("materia", m)
        counts.push({ materia: m, count: count ?? 0 })
      }
      setMateriaCounts(counts)
    }
    loadCounts()
  }, [supabase])

  const handleFiltrar = useCallback(() => {
    const params = new URLSearchParams()
    if (materia) params.set("materia", materia)
    if (banca) params.set("banca", banca)
    if (ano) params.set("ano", ano)
    const qs = params.toString()
    router.push(`/questoes/resolver${qs ? `?${qs}` : ""}`)
  }, [materia, banca, ano, router])

  const handleAleatorio = useCallback(() => {
    router.push("/questoes/resolver?aleatorio=true")
  }, [router])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <PageHeader
          badge="QUESTÕES"
          title="Pratique e evolua"
          subtitle="Resolva questões filtradas por matéria, banca e ano"
        />
        <span className="text-sm text-muted font-mono mt-1">
          {total} disponíveis
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
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Ano</option>
            {anosList.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-background border border-card-border rounded-card px-3 py-3.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          >
            <option value="">Área</option>
            <option value="Concursos Gerais">Concursos Gerais</option>
            <option value="OAB">OAB</option>
            <option value="Militar">Militar</option>
            <option value="ENEM">ENEM</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFiltrar}
            className="bg-accent text-accent-foreground font-bold px-6 py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:opacity-88 transition-opacity"
          >
            FILTRAR
          </button>
          <button
            onClick={handleAleatorio}
            className="bg-transparent border border-card-border text-[#888888] font-semibold px-6 py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:border-[#3A3A3A] hover:text-foreground transition-all"
          >
            ALEATÓRIO
          </button>
        </div>
      </div>

      {/* GRADE DE MATÉRIAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {materiaCounts.map((mc, i) => (
          <motion.button
            key={mc.materia}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => {
              setMateria(mc.materia)
              router.push(`/questoes/resolver?materia=${encodeURIComponent(mc.materia)}`)
            }}
            className="bg-card border border-card-border rounded-card p-4 text-left hover:border-accent/30 transition-colors group"
          >
            <div className="text-xs text-muted font-mono mb-1">{String(i + 1).padStart(2, "0")}</div>
            <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
              {mc.materia}
            </div>
            <div className="text-xs text-muted mt-1">
              {mc.count} {mc.count === 1 ? "questão" : "questões"}
            </div>
          </motion.button>
        ))}
      </div>

      {/* LINK HISTÓRICO */}
      <div className="text-center pt-2">
        <a
          href="/questoes/historico"
          className="text-xs text-muted hover:text-accent transition-colors font-mono"
        >
          [ histórico de respostas → ]
        </a>
      </div>
    </motion.div>
  )
}
