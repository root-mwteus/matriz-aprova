"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, Minus, Trophy, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  PanelHeader,
  Progress,
  Skeleton,
  Stat,
} from "@/components/ui"

/**
 * Resultado do simulado.
 *
 * Duas correções de conteúdo, além do visual:
 *
 * · o botão "Ver gabarito completo" levava para /questoes/resolver, que
 *   não tem relação com este simulado — e o gabarito já está nesta mesma
 *   página. As ações passaram a ser o que faz sentido a seguir: refazer
 *   ou conferir o ranking;
 * · o gabarito mostrava só a alternativa marcada. Sem a correta ao lado,
 *   não dava para aprender nada com um erro.
 */

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

const letra = (i: number) => String.fromCharCode(65 + i)

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
      <div className="mx-auto max-w-[640px] space-y-5">
        <Panel className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-1.5 w-full" />
        </Panel>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!data) {
    return (
      <Panel flush className="mx-auto max-w-[560px]">
        <EmptyState
          icon={<Trophy size={16} strokeWidth={1.75} />}
          title="Resultado não encontrado"
          description="Este simulado não existe ou foi removido."
          action={
            <Button variant="accent" onClick={() => router.push("/simulados")}>
              Montar novo simulado
            </Button>
          }
        />
      </Panel>
    )
  }

  const total = data.questoes.length
  const acertos = data.pontuacao
  const brancos = data.questoes.filter((q) => q.resposta_dada === null).length
  const erros = total - acertos - brancos
  const pct = total > 0 ? Math.round((acertos / total) * 100) : 0

  const materias: Record<string, { acertos: number; total: number }> = {}
  for (const q of data.questoes) {
    if (!materias[q.materia]) materias[q.materia] = { acertos: 0, total: 0 }
    materias[q.materia].total++
    if (q.resposta_dada !== null && q.resposta_dada === q.resposta_correta) {
      materias[q.materia].acertos++
    }
  }

  const porMateria = Object.entries(materias)
    .map(([materia, info]) => ({
      materia,
      ...info,
      pct: info.total > 0 ? Math.round((info.acertos / info.total) * 100) : 0,
    }))
    .sort((a, b) => b.pct - a.pct)

  const tom = pct >= 70 ? "positive" : pct >= 50 ? "caution" : "negative"
  const tempoMin = Math.floor(data.tempo_total / 60)
  const tempoSeg = data.tempo_total % 60

  return (
    <div className="mx-auto max-w-[640px] animate-rise space-y-5">
      {/* ── Placar ──────────────────────────────────────────── */}
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-fg-subtle">Resultado</p>
            <p className="mt-1.5 text-4xl font-semibold tabular-nums text-fg">
              {acertos}
              <span className="text-xl text-fg-faint">/{total}</span>
            </p>
          </div>
          <Badge tone={tom} className="mt-1">
            {pct}% de acerto
          </Badge>
        </div>

        <Progress value={pct} tone={tom} className="mt-4" label={`${pct}% de acerto`} />

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Acertos" value={acertos} />
          <Stat label="Erros" value={erros} />
          <Stat label="Em branco" value={brancos} />
          <Stat label="Tempo" value={`${tempoMin}m ${tempoSeg}s`} />
        </div>

        <p className="mt-4 text-xs text-fg-faint">
          Realizado em{" "}
          {new Date(data.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </Panel>

      {/* ── Por matéria ─────────────────────────────────────── */}
      <Panel flush>
        <PanelHeader title="Desempenho por matéria" description="Da melhor para a pior" />
        <ul>
          {porMateria.map((m) => (
            <li key={m.materia} className="border-b border-line px-4 py-3 last:border-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-fg">{m.materia}</span>
                <span className="shrink-0 text-sm tabular-nums text-fg-muted">
                  {m.acertos}/{m.total}
                  <span className="ml-2 text-fg-faint">{m.pct}%</span>
                </span>
              </div>
              <Progress
                value={m.pct}
                size="sm"
                tone={m.pct >= 70 ? "positive" : m.pct >= 50 ? "caution" : "negative"}
                className="mt-2"
              />
            </li>
          ))}
        </ul>
      </Panel>

      {/* ── Gabarito ────────────────────────────────────────── */}
      <Panel flush>
        <PanelHeader title="Gabarito" description={`${total} questões`} />
        <ul>
          {data.questoes.map((q, i) => {
            const respondeu = q.resposta_dada !== null
            const acertou = respondeu && q.resposta_dada === q.resposta_correta

            return (
              <li
                key={q.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-0"
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full",
                    acertou
                      ? "bg-positive-soft text-positive"
                      : respondeu
                        ? "bg-negative-soft text-negative"
                        : "bg-surface-sunken text-fg-faint"
                  )}
                >
                  {acertou ? (
                    <Check size={11} strokeWidth={3} />
                  ) : respondeu ? (
                    <X size={11} strokeWidth={3} />
                  ) : (
                    <Minus size={11} strokeWidth={3} />
                  )}
                </span>

                <span className="w-7 shrink-0 text-xs tabular-nums text-fg-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">{q.materia}</span>

                {/* A alternativa correta aparece sempre que houve erro — é
                    o que transforma o gabarito em revisão. */}
                <span className="shrink-0 text-sm tabular-nums">
                  <span className="sr-only">
                    {acertou ? "Acertou. " : respondeu ? "Errou. " : "Em branco. "}
                  </span>
                  {respondeu ? (
                    <span className={acertou ? "text-positive" : "text-negative"}>
                      {letra(q.resposta_dada!)}
                    </span>
                  ) : (
                    <span className="text-fg-faint">—</span>
                  )}
                  {!acertou && (
                    <span className="ml-2 text-xs text-fg-subtle">
                      correta <span className="text-positive">{letra(q.resposta_correta)}</span>
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </Panel>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="accent" size="lg" block onClick={() => router.push("/simulados")}>
          Fazer outro simulado
        </Button>
        <Button variant="secondary" size="lg" block onClick={() => router.push("/simulados/ranking")}>
          Ver ranking
        </Button>
      </div>
    </div>
  )
}
