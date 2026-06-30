"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { Question, UserAnswer } from "@/types"

type Filtro = "todas" | "corretas" | "erradas" | "revisar"

type RespostaComQuestao = UserAnswer & {
  question: Question
}

const ITEMS_POR_PAGINA = 15

export default function HistoricoPage() {
  const supabase = createClient()
  const [respostas, setRespostas] = useState<RespostaComQuestao[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [pagina, setPagina] = useState(0)
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from("user_answers")
        .select("*, question:question_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      const { count } = await supabase
        .from("user_answers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
      setTotal(count ?? 0)

      const { data } = await query

      if (data) {
        setRespostas(data as unknown as RespostaComQuestao[])
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const filtradas = respostas.filter((r) => {
    if (filtro === "corretas") return r.correto
    if (filtro === "erradas") return !r.correto
    return true
  })

  const paginadas = filtradas.slice(0, (pagina + 1) * ITEMS_POR_PAGINA)
  const temMais = filtradas.length > paginadas.length
  const acertos = respostas.filter((r) => r.correto).length
  const taxa = respostas.length > 0 ? Math.round((acertos / respostas.length) * 100) : null

  const filtros: { key: Filtro; label: string }[] = [
    { key: "todas", label: "Todas" },
    { key: "corretas", label: "Corretas" },
    { key: "erradas", label: "Erradas" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando histórico...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">
          / HISTÓRICO
        </h1>
        {taxa !== null && (
          <span className="text-sm text-accent font-bold">{taxa}%</span>
        )}
      </div>

      {/* FILTROS */}
      <div className="flex items-center gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFiltro(f.key); setPagina(0) }}
            className={`px-4 py-2 rounded-card text-xs font-semibold transition-all ${
              filtro === f.key
                ? "bg-accent text-accent-foreground"
                : "bg-card border border-card-border text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* LISTA */}
      {paginadas.length === 0 ? (
        <div className="bg-card border border-card-border rounded-card p-10 text-center space-y-3">
          <span className="text-4xl">📝</span>
          <p className="text-sm text-muted">Nenhuma questão respondida ainda.</p>
          <a
            href="/questoes"
            className="inline-block text-xs text-accent font-semibold hover:underline"
          >
            Resolver questões →
          </a>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-card overflow-hidden">
          {paginadas.map((r, i) => (
            <div
              key={r.id}
              className={`px-5 py-4 flex items-start gap-3 ${
                i < paginadas.length - 1 ? "border-b border-card-border/50" : ""
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 flex-shrink-0 ${
                  r.correto
                    ? "bg-accent/20 text-accent"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {r.correto ? "✓" : "✗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  {r.question?.enunciado ?? "Questão"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted">
                    {r.question?.materia || ""}
                    {r.question?.banca ? ` · ${r.question.banca}` : ""}
                    {r.question?.ano ? ` · ${r.question.ano}` : ""}
                  </span>
                  {!r.correto && (
                    <span className="text-[10px] text-red-400 font-medium">
                      revisar
                    </span>
                  )}
                </div>
              </div>
              {r.tempo_segundos && (
                <span className="text-[11px] text-muted flex-shrink-0">
                  {Math.floor(r.tempo_segundos / 60)}m {r.tempo_segundos % 60}s
                </span>
              )}
            </div>
          ))}

          {temMais && (
            <button
              onClick={() => setPagina(pagina + 1)}
              className="w-full py-4 text-xs text-muted hover:text-accent transition-colors font-mono"
            >
              [ carregar mais ↓ ]
            </button>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center text-[11px] text-muted font-mono">
        {total} {total === 1 ? "questão respondida" : "questões respondidas"} · {acertos} corretas · {total - acertos} erradas
      </div>
    </motion.div>
  )
}
