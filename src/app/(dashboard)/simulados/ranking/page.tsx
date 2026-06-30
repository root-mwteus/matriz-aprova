"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface RankingEntry {
  user_id: string
  nome: string
  pontuacao: number
  total: number
  tempo_total: number
  pct: number
  created_at: string
}

export default function RankingPage() {
  const supabase = createClient()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: simulations } = await supabase
        .from("simulations")
        .select("*")
        .not("pontuacao", "eq", -1)
        .order("created_at", { ascending: false })
        .limit(200)

      if (!simulations) { setLoading(false); return }

      const melhores = new Map<string, RankingEntry>()

      for (const s of simulations) {
        const total = (s.questoes as any[])?.length || 0
        const pct = total > 0 ? Math.round((s.pontuacao / total) * 100) : 0

        if (!melhores.has(s.user_id) || (melhores.get(s.user_id)?.pct ?? 0) < pct) {
          const { data: perfil } = await supabase
            .from("profiles")
            .select("nome")
            .eq("id", s.user_id)
            .single()

          melhores.set(s.user_id, {
            user_id: s.user_id,
            nome: perfil?.nome || "Anônimo",
            pontuacao: s.pontuacao,
            total,
            tempo_total: s.tempo_total,
            pct,
            created_at: s.created_at,
          })
        }
      }

      const ordenado = Array.from(melhores.values())
        .sort((a, b) => b.pct - a.pct || a.tempo_total - b.tempo_total)
        .slice(0, 50)

      setRanking(ordenado)
      setLoading(false)
    }
    load()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando ranking...</div>
      </div>
    )
  }

  const userPos = ranking.findIndex((e) => e.user_id === userId) + 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[480px] mx-auto space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">
          / RANKING
        </h1>
        <a
          href="/simulados"
          className="text-xs text-muted hover:text-accent transition-colors font-mono"
        >
          [ simulados ]
        </a>
      </div>

      {/* POSIÇÃO DO USUÁRIO */}
      {userPos > 0 && (
        <div className="bg-card border border-card-border rounded-card p-5 text-center space-y-1">
          <span className="text-xs text-muted font-mono">SUA POSIÇÃO</span>
          <div className="text-4xl font-bold text-accent">#{userPos}</div>
          {userPos === 1 && (
            <span className="inline-block px-3 py-1 rounded-full bg-badge-bg text-accent border border-badge-border text-xs font-bold">
              🏆 #1 DA SEMANA
            </span>
          )}
        </div>
      )}

      {/* LISTAGEM */}
      <div className="bg-card border border-card-border rounded-card overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border">
          <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
            MELHORES RESULTADOS
          </h3>
        </div>

        {ranking.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            Nenhum resultado ainda. Seja o primeiro!
          </div>
        ) : (
          <div className="divide-y divide-card-border/50">
            {ranking.map((entry, i) => {
              const isUser = entry.user_id === userId
              return (
                <div
                  key={entry.user_id}
                  className={`px-5 py-3.5 flex items-center gap-3 ${
                    isUser ? "bg-accent/5" : ""
                  }`}
                >
                  <span className={`w-7 text-sm font-bold ${
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
                  }`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate block">
                      {entry.nome}
                      {isUser && (
                        <span className="text-[10px] text-muted ml-2">(você)</span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted">
                      {entry.pontuacao}/{entry.total} acertos
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-accent">{entry.pct}%</div>
                    <div className="text-[10px] text-muted">
                      {Math.floor(entry.tempo_total / 60)}m
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
