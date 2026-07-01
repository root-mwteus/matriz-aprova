"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface QuestaoResultado {
  id: string
  materia: string
  resposta_correta: number
  resposta_dada: number | null
}

interface ResultadoData {
  questoes: QuestaoResultado[]
  pontuacao: number
  tempo_total: number
  created_at: string
}

export default function ResultadoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [data, setData] = useState<ResultadoData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: sim } = await supabase
        .from("simulations")
        .select("*")
        .eq("id", params.id)
        .single()

      if (sim) {
        setData({
          questoes: sim.questoes,
          pontuacao: sim.pontuacao,
          tempo_total: sim.tempo_total,
          created_at: sim.created_at,
        })
      }
      setLoading(false)
    }
    load()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando resultado...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-card border border-card-border rounded-card p-10 text-center space-y-4">
        <span className="text-5xl">🏆</span>
        <p className="text-muted">Resultado não encontrado.</p>
        <button
          onClick={() => router.push("/simulados")}
          className="bg-accent text-accent-foreground font-bold px-6 py-3 rounded-card text-sm hover:bg-accent/90 transition-all"
        >
          NOVO SIMULADO
        </button>
      </div>
    )
  }

  const total = data.questoes.length
  const acertos = data.pontuacao
  const erros = total - acertos
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0

  const materias: Record<string, { acertos: number; erros: number; total: number }> = {}
  for (const q of data.questoes) {
    if (!materias[q.materia]) materias[q.materia] = { acertos: 0, erros: 0, total: 0 }
    materias[q.materia].total++
    if (q.resposta_dada !== null && q.resposta_dada === q.resposta_correta) {
      materias[q.materia].acertos++
    } else {
      materias[q.materia].erros++
    }
  }

  const tempoMin = Math.floor(data.tempo_total / 60)
  const tempoSeg = data.tempo_total % 60

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[480px] mx-auto space-y-6"
    >
      {/* PLACAR */}
      <div className="bg-card border border-card-border rounded-card p-8 text-center space-y-4">
        <div className="text-6xl font-bold text-accent">
          {acertos}
          <span className="text-2xl text-muted">/{total}</span>
        </div>
        <div className="text-3xl font-bold text-foreground">{pct}%</div>
        <p className="text-sm text-muted">
          {tempoMin}m {tempoSeg}s · {new Date(data.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* POR MATÉRIA */}
      <div className="bg-card border border-card-border rounded-card overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
            DESEMPENHO POR MATÉRIA
          </h3>
        </div>
        <div className="divide-y divide-card-border/50">
          {Object.entries(materias).map(([materia, info]) => {
            const pctMat = info.total > 0 ? Math.round((info.acertos / info.total) * 100) : 0
            return (
              <div key={materia} className="px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-foreground">{materia}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-accent">{info.acertos} acertos</span>
                  <span className="text-red-400">{info.erros} erros</span>
                  <span className="text-muted font-mono">{pctMat}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* GABARITO */}
      <div className="bg-card border border-card-border rounded-card overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
            GABARITO
          </h3>
        </div>
        <div className="divide-y divide-card-border/50">
          {data.questoes.map((q, i) => {
            const acertou = q.resposta_dada !== null && q.resposta_dada === q.resposta_correta
            const respondeu = q.resposta_dada !== null
            return (
              <div key={q.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      acertou
                        ? "bg-accent/20 text-accent"
                        : respondeu
                        ? "bg-red-500/20 text-red-400"
                        : "bg-card-border text-muted"
                    }`}
                  >
                    {acertou ? "✓" : respondeu ? "✗" : "–"}
                  </span>
                  <span className="text-muted font-mono text-xs">Q{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-muted text-xs">{q.materia}</span>
                </div>
                <span className="text-muted text-xs">
                  {respondeu
                    ? `Sua: ${String.fromCharCode(65 + q.resposta_dada!)}`
                    : "Não respondida"}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* AÇÕES */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => router.push("/questoes/resolver")}
          className="flex-1 bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-sm hover:bg-accent/90 transition-all"
        >
          VER GABARITO COMPLETO
        </button>
        <button
          onClick={() => router.push("/simulados")}
          className="flex-1 bg-transparent border border-foreground/20 text-foreground font-semibold py-3.5 rounded-card text-sm hover:bg-white/5 transition-all"
        >
          NOVO SIMULADO
        </button>
      </div>
    </motion.div>
  )
}
