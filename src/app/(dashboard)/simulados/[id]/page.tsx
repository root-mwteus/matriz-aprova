"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"
import { cn } from "@/lib/utils"
import { Badge, Button, EmptyState, Modal, Panel } from "@/components/ui"

/**
 * Simulado em andamento.
 *
 * O defeito principal era de contagem: o tempo restante era decrementado
 * a cada tick de `setInterval`. O navegador estrangula timers em abas
 * inativas, então trocar de aba **dava tempo extra** — inaceitável numa
 * prova cronometrada. Agora o restante é derivado de `cache.inicio`, que
 * já estava salvo, e o relógio de parede é a única fonte de verdade.
 *
 * O navegador de questões era uma fila de 50 quadradinhos de 20px numa
 * linha só, que estourava a largura e não dizia o que cada estado
 * significava. Virou grade com legenda.
 */

interface SimCache {
  questoes: Question[]
  respostas: Record<string, number>
  tempoLimite: number
  inicio: number
}

const LETRAS = ["A", "B", "C", "D", "E"]

export default function SimuladoPage() {
  const params = useParams()
  const router = useRouter()

  const [cache, setCache] = useState<SimCache | null>(null)
  const [indice, setIndice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [agora, setAgora] = useState(() => Date.now())
  const [showModal, setShowModal] = useState(false)
  const [finalizando, setFinalizando] = useState(false)

  const finalizarRef = useRef<(auto: boolean) => Promise<void>>()
  const jaFinalizou = useRef(false)

  useEffect(() => {
    const raw = localStorage.getItem(`sim_${params.id}`)
    if (!raw) {
      setLoading(false)
      return
    }
    try {
      setCache(JSON.parse(raw) as SimCache)
    } catch {
      localStorage.removeItem(`sim_${params.id}`)
    }
    setLoading(false)
  }, [params.id])

  // Um único relógio. O intervalo só empurra o "agora"; o restante é
  // sempre recalculado, então atrasos de tick não acumulam erro.
  useEffect(() => {
    if (!cache) return
    const id = setInterval(() => setAgora(Date.now()), 500)
    return () => clearInterval(id)
  }, [cache])

  const tempoRestante = useMemo(() => {
    if (!cache) return 0
    const decorrido = Math.floor((agora - cache.inicio) / 1000)
    return Math.max(0, cache.tempoLimite * 60 - decorrido)
  }, [cache, agora])

  const salvarResposta = useCallback(
    (questionId: string, alternativa: number) => {
      setCache((atual) => {
        if (!atual) return atual
        const novo = { ...atual, respostas: { ...atual.respostas, [questionId]: alternativa } }
        localStorage.setItem(`sim_${params.id}`, JSON.stringify(novo))
        return novo
      })
    },
    [params.id]
  )

  const handleFinalizar = useCallback(async () => {
    if (!cache || jaFinalizou.current) return
    jaFinalizou.current = true
    setFinalizando(true)

    // A finalização passa pelo servidor: lá os acertos são recomputados a
    // partir do gabarito e gravados — o cliente não toca mais em
    // `simulations` (a migração 012 removeu o UPDATE direto, evitando
    // inflar a própria pontuação no ranking).
    const tempoGasto = cache.tempoLimite * 60 - tempoRestante

    let res: Response
    try {
      res = await fetch(`/api/simulados/${params.id}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: cache.respostas, tempoTotal: tempoGasto }),
      })
    } catch {
      // Rede caiu — libera para tentar de novo em vez de travar a tela.
      jaFinalizou.current = false
      setFinalizando(false)
      return
    }

    if (!res.ok) {
      jaFinalizou.current = false
      setFinalizando(false)
      return
    }

    localStorage.removeItem(`sim_${params.id}`)
    router.push(`/simulados/resultado/${params.id}`)
  }, [cache, params.id, router, tempoRestante])

  useEffect(() => {
    finalizarRef.current = handleFinalizar
  }, [handleFinalizar])

  // Tempo esgotado encerra sozinho.
  useEffect(() => {
    if (cache && tempoRestante === 0 && !jaFinalizou.current) {
      finalizarRef.current?.(true)
    }
  }, [cache, tempoRestante])

  const formatTempo = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  if (loading) {
    return (
      <div className="mx-auto max-w-[720px] space-y-4">
        <div className="skeleton h-12 w-full" />
        <div className="skeleton h-[420px] w-full" />
      </div>
    )
  }

  if (!cache) {
    return (
      <Panel flush className="mx-auto max-w-[560px]">
        <EmptyState
          icon={<Target size={16} strokeWidth={1.75} />}
          title="Simulado não encontrado"
          description="Ele já foi finalizado ou foi aberto em outro navegador."
          action={
            <Button variant="accent" onClick={() => router.push("/simulados")}>
              Montar novo simulado
            </Button>
          }
        />
      </Panel>
    )
  }

  const questao = cache.questoes[indice]
  if (!questao) return null

  const respondidas = Object.keys(cache.respostas).length
  const total = cache.questoes.length
  const pctTimer = (tempoRestante / (cache.tempoLimite * 60)) * 100
  const urgente = tempoRestante < 300

  return (
    <div className="mx-auto max-w-[720px] space-y-4">
      {/* ── Cabeçalho fixo ──────────────────────────────────── */}
      <div className="sticky top-topbar z-10 -mx-4 bg-canvas/90 px-4 pb-3 pt-1 backdrop-blur-md lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-fg-subtle tabular-nums">
            Questão {indice + 1} de {total}
          </span>

          <time
            aria-live={urgente ? "polite" : "off"}
            className={cn(
              "font-mono text-lg font-semibold tabular-nums",
              urgente ? "text-negative" : "text-fg"
            )}
          >
            {formatTempo(tempoRestante)}
          </time>

          <span className="text-sm text-fg-subtle tabular-nums">
            {respondidas}/{total} respondidas
          </span>
        </div>

        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-1000 ease-linear",
              urgente ? "bg-negative" : "bg-accent"
            )}
            style={{ width: `${pctTimer}%` }}
          />
        </div>
      </div>

      {/* ── Questão ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={questao.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <Panel flush>
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-5 py-3">
              <Badge size="sm">{questao.materia}</Badge>
              {questao.banca && <Badge size="sm">{questao.banca}</Badge>}
              {questao.ano && <Badge size="sm">{questao.ano}</Badge>}
            </div>

            {questao.mostrar_texto && questao.texto_referencia && (
              <div className="border-b border-line bg-surface-sunken px-5 py-4">
                <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-fg-faint">
                  Texto de apoio
                </p>
                <LatexText
                  text={questao.texto_referencia}
                  block
                  className="text-base leading-relaxed text-fg-muted"
                />
              </div>
            )}

            <div className="px-5 py-5">
              {questao.figuras?.length > 0 && (
                <div className="mb-4 space-y-3">
                  {(questao.figuras as QuestaoFigura[]).map((fig) => {
                    const client = createClient()
                    const { data } = client.storage
                      .from("questoes-figuras")
                      .getPublicUrl(fig.storage_path)
                    return (
                      <figure key={fig.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={data.publicUrl}
                          alt={fig.legenda || "Figura da questão"}
                          className="max-w-full rounded-md border border-line"
                        />
                        {fig.legenda && (
                          <figcaption className="mt-1.5 text-center text-xs text-fg-subtle">
                            {fig.legenda}
                          </figcaption>
                        )}
                      </figure>
                    )
                  })}
                </div>
              )}

              <LatexText
                text={questao.enunciado}
                block
                className="text-base leading-relaxed text-fg"
              />
            </div>

            <div role="radiogroup" aria-label="Alternativas" className="space-y-1.5 px-5 pb-5">
              {questao.alternativas.map((alt, i) => {
                const selecionada = cache.respostas[questao.id] === i
                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={selecionada}
                    onClick={() => salvarResposta(questao.id, i)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left",
                      "transition-[border-color,background-color] duration-fast",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                      selecionada
                        ? "border-line-accent bg-accent-soft"
                        : "border-line hover:border-line-strong hover:bg-surface-hover"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border text-xs font-medium",
                        selecionada
                          ? "border-line-accent text-accent-ink"
                          : "border-line-strong text-fg-subtle"
                      )}
                    >
                      {LETRAS[i]}
                    </span>
                    <LatexText
                      text={alt.text || ""}
                      className="flex-1 text-base leading-relaxed text-fg"
                    />
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <Button
                variant="secondary"
                disabled={indice === 0}
                onClick={() => setIndice(indice - 1)}
              >
                <ChevronLeft size={14} strokeWidth={2} />
                Anterior
              </Button>

              {indice === total - 1 ? (
                <Button variant="accent" onClick={() => setShowModal(true)}>
                  Finalizar simulado
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => setIndice(indice + 1)}>
                  Próxima
                  <ChevronRight size={14} strokeWidth={2} />
                </Button>
              )}
            </div>
          </Panel>
        </motion.div>
      </AnimatePresence>

      {/* ── Navegador ───────────────────────────────────────── */}
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Todas as questões</h2>
          <div className="flex items-center gap-3 text-2xs text-fg-subtle">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" aria-hidden />
              atual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-[3px] border border-line-accent bg-accent-soft"
                aria-hidden
              />
              respondida
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-surface-sunken" aria-hidden />
              em branco
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {cache.questoes.map((q, i) => {
            const respondida = cache.respostas[q.id] !== undefined
            const atual = i === indice
            return (
              <button
                key={q.id}
                onClick={() => setIndice(i)}
                aria-label={`Questão ${i + 1}${respondida ? ", respondida" : ", em branco"}`}
                aria-current={atual ? "true" : undefined}
                className={cn(
                  "h-7 w-7 rounded-[6px] text-xs font-medium tabular-nums",
                  "transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  atual
                    ? "bg-accent text-fg-on-accent"
                    : respondida
                      ? "border border-line-accent bg-accent-soft text-accent-ink"
                      : "bg-surface-sunken text-fg-subtle hover:bg-surface-hover hover:text-fg"
                )}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end border-t border-line pt-3">
          <Button variant="ghost" onClick={() => setShowModal(true)}>
            Finalizar agora
          </Button>
        </div>
      </Panel>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Finalizar simulado?"
        description={
          respondidas < total
            ? `Você respondeu ${respondidas} de ${total}. As ${total - respondidas} em branco contam como erro.`
            : `Você respondeu todas as ${total} questões.`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={finalizando}>
              Continuar prova
            </Button>
            <Button variant="accent" onClick={handleFinalizar} loading={finalizando}>
              Finalizar e ver resultado
            </Button>
          </>
        }
      />
    </div>
  )
}
