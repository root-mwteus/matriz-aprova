"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"

interface SimCache {
  questoes: Question[]
  respostas: Record<string, number>
  tempoLimite: number
  inicio: number
}

export default function SimuladoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [cache, setCache] = useState<SimCache | null>(null)
  const [indice, setIndice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tempoRestante, setTempoRestante] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const timerRef = useRef<number>(0)
  const finalizarRef = useRef<(auto: boolean) => Promise<void>>()

  useEffect(() => {
    const raw = localStorage.getItem(`sim_${params.id}`)
    if (!raw) {
      setLoading(false)
      return
    }
    const data: SimCache = JSON.parse(raw)
    setCache(data)
    const elapsed = Math.floor((Date.now() - data.inicio) / 1000)
    const remaining = Math.max(0, data.tempoLimite * 60 - elapsed)
    setTempoRestante(remaining)
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    if (tempoRestante <= 0) return
    timerRef.current = window.setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          finalizarRef.current?.(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [cache])

  const salvarResposta = useCallback((questionId: string, alternativa: number) => {
    if (!cache) return
    const novasRespostas = { ...cache.respostas, [questionId]: alternativa }
    const novoCache = { ...cache, respostas: novasRespostas }
    setCache(novoCache)
    localStorage.setItem(`sim_${params.id}`, JSON.stringify(novoCache))
  }, [cache, params.id])

  const handleFinalizar = useCallback(async (tempoEsgotado = false) => {
    if (!cache || finalizando) return
    setFinalizando(true)

    const total = cache.questoes.length
    let acertos = 0
    const questoesRespostas: Record<string, number> = {}

    for (const q of cache.questoes) {
      const resposta = cache.respostas[q.id]
      questoesRespostas[q.id] = resposta
      if (resposta !== undefined && resposta === q.resposta_correta) {
        acertos++
      }
    }

    const tempoGasto = cache.tempoLimite * 60 - tempoRestante

    await supabase
      .from("simulations")
      .update({
        pontuacao: acertos,
        tempo_total: tempoGasto,
        questoes: cache.questoes.map((q) => ({
          id: q.id,
          materia: q.materia,
          resposta_correta: q.resposta_correta,
          resposta_dada: cache.respostas[q.id] ?? null,
        })),
      })
      .eq("id", params.id)

    localStorage.removeItem(`sim_${params.id}`)
    router.push(`/simulados/resultado/${params.id}`)
  }, [cache, finalizando, params.id, supabase, router, tempoRestante])

  useEffect(() => { finalizarRef.current = handleFinalizar }, [handleFinalizar])

  const formatTempo = (s: number) => {
    const min = String(Math.floor(s / 60)).padStart(2, "0")
    const seg = String(s % 60).padStart(2, "0")
    return `${min}:${seg}`
  }

  const letras = ["A", "B", "C", "D", "E"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando simulado...</div>
      </div>
    )
  }

  if (!cache) {
    return (
      <div className="space-y-6">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">SIMULADO</h1>
        <div className="bg-card border border-card-border rounded-card p-10 text-center space-y-4">
          <span className="text-5xl">🎯</span>
          <p className="text-muted">Simulado não encontrado.</p>
          <button
            onClick={() => router.push("/simulados")}
            className="bg-accent text-accent-foreground font-bold px-6 py-3 rounded-card text-sm hover:bg-accent/90 transition-all"
          >
            NOVO SIMULADO
          </button>
        </div>
      </div>
    )
  }

  const questao = cache.questoes[indice]
  if (!questao) return null

  const respondidas = Object.keys(cache.respostas).length
  const progresso = ((indice + 1) / cache.questoes.length) * 100
  const pctTimer = (tempoRestante / (cache.tempoLimite * 60)) * 100
  const timerUrgente = tempoRestante < 300

  return (
    <div className="space-y-4">
      {/* HEADER FIXO */}
      <div className="bg-card border border-card-border rounded-card p-4 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wider text-foreground uppercase">
          SIMULADO
        </span>
        <div className={`text-lg font-bold font-mono ${timerUrgente ? "text-red-400" : "text-accent"}`}>
          {formatTempo(tempoRestante)}
        </div>
        <span className="text-xs text-muted font-mono">
          Q {indice + 1}/{cache.questoes.length}
        </span>
      </div>

      {/* TIMER BAR */}
      <div className="w-full h-1 bg-card-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            timerUrgente ? "bg-red-500" : "bg-accent"
          }`}
          style={{ width: `${pctTimer}%` }}
        />
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

          <div className="px-5 py-4 space-y-2.5">
            {(questao.alternativas as any[]).map((alt, i) => {
              const selecionada = cache.respostas[questao.id] === i
              return (
                <button
                  key={i}
                  onClick={() => salvarResposta(questao.id, i)}
                  className={`w-full flex items-start gap-3 px-4 py-3 rounded-card border transition-all text-left text-sm ${
                    selecionada
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-transparent border border-card-border text-foreground hover:border-accent/50"
                  }`}
                >
                  <span className="font-bold flex-shrink-0 w-5">{letras[i]}</span>
                  <LatexText text={alt.text || (alt as any).texto || ""} className="flex-1" />
                  {selecionada && <span className="text-accent flex-shrink-0">✓</span>}
                </button>
              )
            })}
          </div>

          {/* NAVEGAÇÃO */}
          <div className="px-5 py-4 border-t border-card-border">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setIndice(Math.max(0, indice - 1))}
                disabled={indice === 0}
                className="px-5 py-2.5 rounded-card text-sm font-semibold bg-background border border-card-border text-muted hover:text-foreground disabled:opacity-30 transition-all"
              >
                ←
              </button>

              <div className="flex items-center gap-1.5">
                {cache.questoes.map((q, i) => {
                  const respondida = cache.respostas[q.id] !== undefined
                  return (
                    <button
                      key={q.id}
                      onClick={() => setIndice(i)}
                      className={`w-5 h-5 rounded text-[10px] font-bold transition-all ${
                        i === indice
                          ? "bg-accent text-accent-foreground"
                          : respondida
                          ? "bg-accent/30 text-accent"
                          : "bg-card-border text-muted"
                      }`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setIndice(Math.min(cache.questoes.length - 1, indice + 1))}
                disabled={indice === cache.questoes.length - 1}
                className="px-5 py-2.5 rounded-card text-sm font-semibold bg-background border border-card-border text-muted hover:text-foreground disabled:opacity-30 transition-all"
              >
                →
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* PROGRESSO */}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{respondidas}/{cache.questoes.length} respondidas</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-red-400 hover:text-red-300 font-semibold transition-colors"
        >
          FINALIZAR
        </button>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-card border border-card-border rounded-card p-6 max-w-sm w-full space-y-4"
            >
              <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">
                Finalizar simulado?
              </h3>
              <p className="text-sm text-muted">
                Você respondeu {respondidas} de {cache.questoes.length} questões.
                {respondidas < cache.questoes.length && (
                  <span className="text-red-400 block mt-1">
                    {cache.questoes.length - respondidas} questões não respondidas serão consideradas erradas.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-background border border-card-border text-foreground font-semibold py-3 rounded-card text-sm hover:bg-white/5 transition-all"
                >
                  CONTINUAR
                </button>
                <button
                  onClick={() => handleFinalizar()}
                  disabled={finalizando}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-card text-sm hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {finalizando ? "FINALIZANDO..." : "FINALIZAR"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
