"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"

export function ResolverContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [questao, setQuestao] = useState<Question | null>(null)
  const [questoes, setQuestoes] = useState<Question[]>([])
  const [indice, setIndice] = useState(0)
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const [confirmada, setConfirmada] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const timerRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const [tempo, setTempo] = useState(0)

  useEffect(() => {
    async function load() {
      let query = supabase.from("questions").select("*")

      const materia = searchParams.get("materia")
      const banca = searchParams.get("banca")
      const ano = searchParams.get("ano")
      const aleatorio = searchParams.get("aleatorio")

      if (materia) query = query.eq("materia", materia)
      if (banca) query = query.eq("banca", banca)
      if (ano) query = query.eq("ano", parseInt(ano))

      query = query.order("created_at", { ascending: false }).limit(50)

      const { data } = await query

      if (data && data.length > 0) {
        const embaralhadas = aleatorio
          ? data.sort(() => Math.random() - 0.5)
          : data
        setQuestoes(embaralhadas)
        setQuestao(embaralhadas[0])
      }
      setLoading(false)
    }
    load()
  }, [searchParams, supabase])

  useEffect(() => {
    startTimeRef.current = Date.now()
    setTempo(0)
    timerRef.current = window.setInterval(() => {
      setTempo(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [indice])

  useEffect(() => {
    setSelecionada(null)
    setConfirmada(false)
  }, [questao])

  const formatTempo = (s: number) => {
    const min = String(Math.floor(s / 60)).padStart(2, "0")
    const seg = String(s % 60).padStart(2, "0")
    return `${min}:${seg}`
  }

  const handleConfirmar = useCallback(async () => {
    if (selecionada === null || !questao || confirmada) return
    setConfirmada(true)
    setSalvando(true)

    const correto = selecionada === questao.resposta_correta
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("user_answers").insert({
        user_id: user.id,
        question_id: questao.id,
        resposta_dada: selecionada,
        correto,
        tempo_segundos: tempo,
      })
    }
    setSalvando(false)
  }, [selecionada, questao, confirmada, supabase, tempo])

  const handleProxima = useCallback(() => {
    if (indice < questoes.length - 1) {
      setIndice(indice + 1)
      setQuestao(questoes[indice + 1])
    } else {
      router.push("/questoes/historico")
    }
  }, [indice, questoes, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando questões...</div>
      </div>
    )
  }

  if (!questao) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">
          / QUESTÕES · RESOLVER
        </h1>
        <div className="bg-card border border-card-border rounded-card p-10 text-center space-y-4">
          <span className="text-5xl">📝</span>
          <p className="text-muted">Nenhuma questão encontrada com esses filtros.</p>
          <button
            onClick={() => router.push("/questoes")}
            className="bg-accent text-accent-foreground font-bold px-6 py-3 rounded-card text-sm hover:bg-accent/90 transition-all"
          >
            VOLTAR AOS FILTROS
          </button>
        </div>
      </div>
    )
  }

  const correto = confirmada && selecionada === questao.resposta_correta
  const progresso = ((indice + 1) / questoes.length) * 100
  const letras = ["A", "B", "C", "D", "E"]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-[600px] mx-auto"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">
            / QUESTÕES · RESOLVER
          </h1>
          <p className="text-xs text-muted">
            {questao.materia}{questao.banca ? ` · ${questao.banca}` : ""}{questao.ano ? ` · ${questao.ano}` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-accent font-mono">
            {formatTempo(tempo)}
          </div>
          <div className="text-[10px] text-muted tracking-widest uppercase">tempo</div>
        </div>
      </div>

      {/* BARRA DE PROGRESSO */}
      <div className="w-full h-1 bg-card-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300 rounded-full"
          style={{ width: `${progresso}%` }}
        />
      </div>
      <div className="text-[11px] text-muted font-mono text-right">
        {indice + 1} / {questoes.length}
      </div>

      {/* QUESTÃO */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questao.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card border border-card-border rounded-card overflow-hidden"
        >
          {/* TEXTO DE REFERÊNCIA */}
          {questao.mostrar_texto && questao.texto_referencia && (
            <div className="px-5 py-4 border-b border-card-border bg-white/[.02]">
              <div className="text-[10px] text-muted font-mono uppercase tracking-widest mb-2">Texto de apoio</div>
              <LatexText text={questao.texto_referencia} block className="text-sm text-foreground/80 leading-relaxed" />
            </div>
          )}

          {/* ENUNCIADO */}
          <div className="px-5 py-6 border-b border-card-border">
            {questao.figuras?.length > 0 && (
              <div className="mb-4 space-y-2">
                {(questao.figuras as QuestaoFigura[]).map((fig) => {
                  const supabase = createClient()
                  const { data } = supabase.storage.from("questoes-figuras").getPublicUrl(fig.storage_path)
                  return (
                    <figure key={fig.id}>
                      <img src={data.publicUrl} alt={fig.legenda || ""} className="max-w-full rounded-lg" />
                      {fig.legenda && <figcaption className="text-[11px] text-muted text-center mt-1">{fig.legenda}</figcaption>}
                    </figure>
                  )
                })}
              </div>
            )}
            <div className="flex items-start gap-3">
              <span className="text-xs text-muted font-mono mt-0.5 flex-shrink-0">
                {String(indice + 1).padStart(2, "0")}
              </span>
              <LatexText text={questao.enunciado} block className="text-sm text-foreground leading-relaxed flex-1" />
            </div>
          </div>

          {/* ALTERNATIVAS */}
          <div className="px-5 py-4 space-y-2.5">
            {(questao.alternativas as any[]).map((alt, i) => {
              let classe = "bg-transparent border border-card-border text-foreground hover:border-accent/50"

              if (confirmada) {
                if (i === questao.resposta_correta) {
                  classe = "bg-accent/20 border-accent text-accent"
                } else if (i === selecionada && i !== questao.resposta_correta) {
                  classe = "bg-red-500/20 border-red-400 text-red-400"
                } else {
                  classe = "bg-transparent border border-card-border text-muted"
                }
              } else if (selecionada === i) {
                classe = "bg-accent/10 border-accent text-accent"
              }

              return (
                <button
                  key={i}
                  onClick={() => !confirmada && setSelecionada(i)}
                  disabled={confirmada}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-card border transition-all text-left text-sm ${classe}`}
                >
                  <span className="font-bold flex-shrink-0 w-5">{letras[i]}</span>
                  <LatexText text={alt.text || (alt as any).texto || ""} className="flex-1" />
                  {confirmada && i === questao.resposta_correta && (
                    <span className="text-accent flex-shrink-0">✓</span>
                  )}
                  {confirmada && i === selecionada && i !== questao.resposta_correta && (
                    <span className="text-red-400 flex-shrink-0">✗</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* CONFIRMAR / PRÓXIMA */}
          <div className="px-5 py-4 border-t border-card-border">
            {!confirmada ? (
              <button
                onClick={handleConfirmar}
                disabled={selecionada === null || salvando}
                className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-sm hover:bg-accent/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {salvando ? "SALVANDO..." : "CONFIRMAR"}
              </button>
            ) : (
              <button
                onClick={handleProxima}
                className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-sm hover:bg-accent/90 transition-all"
              >
                {indice < questoes.length - 1 ? "PRÓXIMA →" : "VER HISTÓRICO →"}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* EXPLICAÇÃO (APÓS CONFIRMAR) */}
      <AnimatePresence>
        {confirmada && questao.explicacao && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-card p-5 border ${
              correto
                ? "bg-accent/10 border-accent/30"
                : "bg-red-500/10 border-red-400/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0 mt-0.5">
                {correto ? "✅" : "❌"}
              </span>
              <div>
                <p className={`text-sm font-bold mb-2 ${correto ? "text-accent" : "text-red-400"}`}>
                  {correto ? "CORRETO!" : "ERRADO!"}
                </p>
                <LatexText text={questao.explicacao} block className="text-sm text-foreground/80 leading-relaxed" />
                {questao.referencias && (
                  <p className="text-xs text-muted mt-2 pt-2 border-t border-white/10 whitespace-pre-line">{questao.referencias}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVEGAÇÃO INFERIOR */}
      <div className="flex items-center justify-between text-xs text-muted">
        <button
          onClick={() => router.push("/questoes")}
          className="hover:text-accent transition-colors"
        >
          ← FILTROS
        </button>
        <span className="font-mono">{questao.nivel?.toUpperCase() || "MÉDIO"}</span>
      </div>
    </motion.div>
  )
}
