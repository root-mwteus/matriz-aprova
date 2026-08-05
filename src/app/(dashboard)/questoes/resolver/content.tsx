"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Check, FileQuestion, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"
import { cn } from "@/lib/utils"
import { Badge, Button, EmptyState, Kbd, Panel } from "@/components/ui"

/**
 * Resolução de questões — a tela onde a pessoa passa mais tempo.
 *
 * Prioridades desta reescrita:
 *
 * · **medida de leitura.** O enunciado ficava num container de 600px com
 *   texto de 13px; passou para ~68 caracteres por linha com corpo maior e
 *   entrelinha folgada. É a única tela do produto que é texto corrido, e
 *   ela precisa se comportar como texto corrido.
 *
 * · **teclado.** A, B, C… escolhem; Enter confirma e avança. Quem resolve
 *   cinquenta questões seguidas não quer mirar o mouse cinquenta vezes.
 *   Os atalhos estão visíveis nas alternativas, não escondidos.
 *
 * · **feedback sem cor sozinha.** Certo e errado são marcados por ícone,
 *   borda e texto além da cor.
 *
 * · **cronômetro discreto.** Estava em destaque, no mesmo peso do título.
 *   Contar o tempo é útil no relatório, não durante a leitura — ele conta
 *   igual, num canto silencioso.
 */

const LETRAS = ["A", "B", "C", "D", "E"]

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
  const [tempo, setTempo] = useState(0)
  const [limite, setLimite] = useState(false)

  const timerRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())

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
        const embaralhadas = aleatorio ? data.sort(() => Math.random() - 0.5) : data
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

  const handleConfirmar = useCallback(async () => {
    if (selecionada === null || !questao || confirmada) return
    setConfirmada(true)
    setSalvando(true)

    try {
      const res = await fetch("/api/questoes/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_id: questao.id,
          resposta_dada: selecionada,
          tempo_segundos: tempo,
        }),
      })

      if (res.status === 403) {
        setLimite(true)
      } else if (!res.ok) {
        console.error("responder: falha ao salvar resposta", res.status)
      }
    } catch {
      console.error("responder: falha de conexão ao salvar resposta")
    }
    setSalvando(false)
  }, [selecionada, questao, confirmada, tempo])

  const handleProxima = useCallback(() => {
    if (indice < questoes.length - 1) {
      setIndice(indice + 1)
      setQuestao(questoes[indice + 1])
    } else {
      router.push("/questoes/historico")
    }
  }, [indice, questoes, router])

  /* ── Atalhos de teclado ────────────────────────────────── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const alvo = e.target as HTMLElement
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA") return

      const letra = LETRAS.indexOf(e.key.toUpperCase())
      if (letra >= 0 && letra < (questao?.alternativas.length ?? 0) && !confirmada) {
        e.preventDefault()
        setSelecionada(letra)
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (confirmada) handleProxima()
        else handleConfirmar()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [questao, confirmada, handleConfirmar, handleProxima])

  const formatTempo = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  if (loading) {
    return (
      <div className="mx-auto max-w-[680px] space-y-4">
        <div className="skeleton h-1 w-full" />
        <Panel className="space-y-3">
          <div className="skeleton h-3 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-11 w-full" />
            ))}
          </div>
        </Panel>
      </div>
    )
  }

  if (!questao) {
    return (
      <Panel flush className="mx-auto max-w-[680px]">
        <EmptyState
          icon={<FileQuestion size={16} strokeWidth={1.75} />}
          title="Nenhuma questão com esses filtros"
          description="Tente ampliar a busca — remova a banca ou o ano e tente de novo."
          action={
            <Button variant="secondary" onClick={() => router.push("/questoes")}>
              Voltar aos filtros
            </Button>
          }
        />
      </Panel>
    )
  }

  const correto = confirmada && selecionada === questao.resposta_correta
  const progresso = ((indice + 1) / questoes.length) * 100

  return (
    <div className="mx-auto max-w-[680px]">
      {/* ── Barra de contexto ───────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/questoes")}
          className="inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors duration-fast hover:text-fg"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Filtros
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-fg-subtle">
            {indice + 1} de {questoes.length}
          </span>
          <time className="text-xs tabular-nums text-fg-faint" aria-label="Tempo nesta questão">
            {formatTempo(tempo)}
          </time>
        </div>
      </div>

      {/* Progresso: 2px, sem rótulo — a contagem acima já informa. */}
      <div
        role="progressbar"
        aria-valuenow={indice + 1}
        aria-valuemin={1}
        aria-valuemax={questoes.length}
        className="mb-5 h-0.5 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-slow ease-out"
          style={{ width: `${progresso}%` }}
        />
      </div>

      {/* Limite diário do plano demo atingido */}
      {limite && (
        <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-lg border border-line-accent bg-accent-soft px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-fg">Limite diário de questões atingido</p>
            <p className="text-sm text-fg-muted">
              No plano demo você resolve até 10 questões por dia. Assine o vitalício e estude sem limite.
            </p>
          </div>
          <Button onClick={() => router.push("/assinar")} size="sm">
            Ver plano vitalício →
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={questao.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <Panel flush>
            {/* ── Metadados ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-5 py-3">
              <Badge size="sm">{questao.materia}</Badge>
              {questao.banca && <Badge size="sm">{questao.banca}</Badge>}
              {questao.ano && <Badge size="sm">{questao.ano}</Badge>}
              {questao.nivel && (
                <Badge size="sm" className="capitalize">
                  {questao.nivel}
                </Badge>
              )}
            </div>

            {/* ── Texto de apoio ────────────────────────────── */}
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

            {/* ── Enunciado ─────────────────────────────────── */}
            <div className="px-5 py-5">
              {questao.figuras?.length > 0 && (
                <div className="mb-4 space-y-3">
                  {(questao.figuras as QuestaoFigura[]).map((fig) => {
                    const supabase = createClient()
                    const { data } = supabase.storage
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

            {/* ── Alternativas ──────────────────────────────── */}
            <div
              role="radiogroup"
              aria-label="Alternativas"
              className="space-y-1.5 px-5 pb-5"
            >
              {questao.alternativas.map((alt, i) => {
                const ehCorreta = i === questao.resposta_correta
                const ehEscolhida = i === selecionada
                const revelaCerta = confirmada && ehCorreta
                const revelaErro = confirmada && ehEscolhida && !ehCorreta

                return (
                  <button
                    key={i}
                    role="radio"
                    aria-checked={ehEscolhida}
                    onClick={() => !confirmada && setSelecionada(i)}
                    disabled={confirmada}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left",
                      "transition-[border-color,background-color] duration-fast",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                      "disabled:cursor-default",
                      revelaCerta
                        ? "border-[color:var(--positive)] bg-positive-soft"
                        : revelaErro
                          ? "border-[color:var(--negative)] bg-negative-soft"
                          : confirmada
                            ? "border-line opacity-55"
                            : ehEscolhida
                              ? "border-line-accent bg-accent-soft"
                              : "border-line hover:border-line-strong hover:bg-surface-hover"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border text-xs font-medium",
                        revelaCerta
                          ? "border-[color:var(--positive)] text-positive"
                          : revelaErro
                            ? "border-[color:var(--negative)] text-negative"
                            : ehEscolhida
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

                    {revelaCerta && (
                      <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-positive" />
                    )}
                    {revelaErro && (
                      <X size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-negative" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── Ação ──────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <p className="hidden items-center gap-1.5 text-xs text-fg-faint sm:flex">
                <Kbd>A</Kbd>–<Kbd>{LETRAS[questao.alternativas.length - 1]}</Kbd> escolher
                <span className="mx-1 text-line-strong">·</span>
                <Kbd>↵</Kbd> {confirmada ? "avançar" : "confirmar"}
              </p>

              {!confirmada ? (
                <Button
                  variant="accent"
                  onClick={handleConfirmar}
                  disabled={selecionada === null}
                  loading={salvando}
                  className="ml-auto"
                >
                  Confirmar
                </Button>
              ) : (
                <Button variant="accent" onClick={handleProxima} className="ml-auto">
                  {indice < questoes.length - 1 ? "Próxima questão" : "Ver histórico"}
                </Button>
              )}
            </div>
          </Panel>
        </motion.div>
      </AnimatePresence>

      {/* ── Explicação ──────────────────────────────────────── */}
      <AnimatePresence>
        {confirmada && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "mt-4 rounded-lg border px-5 py-4",
              correto
                ? "border-[color:var(--positive)]/25 bg-positive-soft"
                : "border-[color:var(--negative)]/25 bg-negative-soft"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-1.5 text-sm font-semibold",
                correto ? "text-positive" : "text-negative"
              )}
            >
              {correto ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
              {correto
                ? "Resposta correta"
                : `Resposta correta: ${LETRAS[questao.resposta_correta]}`}
            </p>

            {questao.explicacao && (
              <LatexText
                text={questao.explicacao}
                block
                className="mt-2.5 text-base leading-relaxed text-fg-muted"
              />
            )}

            {questao.referencias && (
              <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-fg-subtle">
                {questao.referencias}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
