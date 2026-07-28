"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, FileQuestion, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Question, UserAnswer } from "@/types"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import { Badge, Button, EmptyState, Panel, PanelFooter, Skeleton, Tabs } from "@/components/ui"

/**
 * Histórico de respostas.
 *
 * Os filtros viraram abas com contagem: antes eram três botões idênticos
 * que não diziam quantos itens havia em cada recorte, então descobrir se
 * havia erros exigia clicar em "Erradas" para ver.
 *
 * O rodapé com o resumo em uma linha corrida ("120 respondidas · 80
 * corretas · 40 erradas") subiu para o cabeçalho, onde é lido antes da
 * lista em vez de depois de rolá-la inteira.
 */

type Filtro = "todas" | "corretas" | "erradas"

type RespostaComQuestao = UserAnswer & { question: Question }

const POR_PAGINA = 15

export default function HistoricoPage() {
  const supabase = createClient()
  const [respostas, setRespostas] = useState<RespostaComQuestao[]>([])
  const [filtro, setFiltro] = useState<Filtro>("todas")
  const [pagina, setPagina] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("user_answers")
        .select("*, question:question_id(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setRespostas(data as unknown as RespostaComQuestao[])
      setLoading(false)
    }
    load()
  }, [supabase])

  const acertos = respostas.filter((r) => r.correto).length
  const erros = respostas.length - acertos
  const taxa = respostas.length > 0 ? Math.round((acertos / respostas.length) * 100) : null

  const filtradas = useMemo(
    () =>
      respostas.filter((r) => {
        if (filtro === "corretas") return r.correto
        if (filtro === "erradas") return !r.correto
        return true
      }),
    [respostas, filtro]
  )

  const visiveis = filtradas.slice(0, (pagina + 1) * POR_PAGINA)
  const temMais = filtradas.length > visiveis.length

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Histórico"
        subtitle={
          loading
            ? "Carregando suas respostas…"
            : respostas.length === 0
              ? "Nenhuma questão respondida ainda."
              : `${respostas.length} ${respostas.length === 1 ? "questão respondida" : "questões respondidas"}.`
        }
        actions={
          taxa != null && (
            <Badge tone={taxa >= 70 ? "positive" : "caution"} dot>
              {taxa}% de acerto
            </Badge>
          )
        }
      />

      <Tabs
        value={filtro}
        onChange={(v) => {
          setFiltro(v)
          setPagina(0)
        }}
        items={[
          { value: "todas", label: "Todas", count: respostas.length },
          { value: "corretas", label: "Corretas", count: acertos },
          { value: "erradas", label: "Erradas", count: erros },
        ]}
      />

      <Panel flush>
        {loading ? (
          <ul>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex gap-3 border-b border-line px-4 py-3.5 last:border-0">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3" style={{ width: `${80 - i * 6}%` }} />
                  <Skeleton className="h-2.5 w-32" />
                </div>
              </li>
            ))}
          </ul>
        ) : visiveis.length === 0 ? (
          <EmptyState
            icon={<FileQuestion size={16} strokeWidth={1.75} />}
            title={
              filtro === "erradas"
                ? "Nenhum erro por aqui"
                : filtro === "corretas"
                  ? "Nenhum acerto registrado"
                  : "Nenhuma questão respondida ainda"
            }
            description={
              filtro === "erradas"
                ? "Todas as questões respondidas até agora estão corretas."
                : "Comece resolvendo algumas questões — o histórico aparece aqui."
            }
            action={
              filtro === "todas" ? (
                <Button variant="secondary" onClick={() => (window.location.href = "/questoes")}>
                  Resolver questões
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ul>
              {visiveis.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors duration-fast last:border-0 hover:bg-surface-hover"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                      r.correto ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"
                    )}
                  >
                    {r.correto ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-fg">{r.question?.enunciado ?? "Questão"}</p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      <span className="sr-only">{r.correto ? "Acertou. " : "Errou. "}</span>
                      {[r.question?.materia, r.question?.banca, r.question?.ano]
                        .filter(Boolean)
                        .join(" · ") || "Sem classificação"}
                    </p>
                  </div>

                  {r.tempo_segundos != null && (
                    <span className="shrink-0 text-xs tabular-nums text-fg-faint">
                      {Math.floor(r.tempo_segundos / 60)}m {r.tempo_segundos % 60}s
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {temMais && (
              <PanelFooter className="justify-center">
                <Button variant="ghost" size="sm" onClick={() => setPagina(pagina + 1)}>
                  Carregar mais {Math.min(POR_PAGINA, filtradas.length - visiveis.length)}
                </Button>
              </PanelFooter>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}
