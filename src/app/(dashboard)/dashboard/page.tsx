"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Check, FileQuestion, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile, Question, UserAnswer, Material } from "@/types"
import { calcularStreakSemana } from "@/lib/streak"
import { cn, diasAte } from "@/lib/utils"
import NivelPanel from "@/components/xp/NivelPanel"
import PageHeader from "@/components/PageHeader"
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Panel,
  PanelFooter,
  PanelHeader,
  Progress,
  Skeleton,
  Stat,
} from "@/components/ui"

/**
 * Painel inicial.
 *
 * Reorganizado em três faixas de prioridade decrescente:
 *   1. números do dia — o que a pessoa abre o painel para conferir;
 *   2. atividade recente — o que ela faz a seguir;
 *   3. sequência e sugestão — contexto, à direita, sem disputar atenção.
 *
 * A saudação saiu do cartão com avatar: o nome de quem está logado já
 * aparece na sidebar, e o cartão gastava uma faixa inteira da tela para
 * repeti-lo.
 */

const diasSemana = ["S", "T", "Q", "Q", "S", "S", "D"]

type QuestaoDoDia = Question & { resposta?: UserAnswer }

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streak, setStreak] = useState<boolean[]>(Array(7).fill(false))
  const [questoes, setQuestoes] = useState<QuestaoDoDia[]>([])
  const [material, setMaterial] = useState<Material | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: perfil } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (perfil) setProfile(perfil)

        const { data: respostas } = await supabase
          .from("user_answers")
          .select("*, question:question_id(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (respostas) {
          setQuestoes(
            respostas.map((r: any) => ({
              ...r.question,
              resposta: {
                id: r.id,
                user_id: r.user_id,
                question_id: r.question_id,
                resposta_dada: r.resposta_dada,
                correto: r.correto,
                tempo_segundos: r.tempo_segundos,
                created_at: r.created_at,
              },
            }))
          )
        }

        const hoje = new Date()
        const dia = hoje.getDay()
        const offsetParaSegunda = dia === 0 ? -6 : 1 - dia
        const segunda = new Date(hoje)
        segunda.setDate(hoje.getDate() + offsetParaSegunda)
        segunda.setHours(0, 0, 0, 0)
        const domingo = new Date(segunda)
        domingo.setDate(segunda.getDate() + 7)

        const { data: streakData } = await supabase
          .from("user_answers")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", segunda.toISOString())
          .lt("created_at", domingo.toISOString())

        setStreak(calcularStreakSemana(streakData || []))

        const { data: mats } = await supabase
          .from("materials")
          .select("*")
          .limit(1)
          .order("incidencia_pct", { ascending: false })
        if (mats && mats.length > 0) setMaterial(mats[0])
      } catch {
        setErro("Não foi possível carregar o painel")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const hoje = new Date().getDay()
  const diaIdx = hoje === 0 ? 6 : hoje - 1
  const streakCount = streak.filter(Boolean).length
  const acertos = questoes.filter((q) => q.resposta?.correto).length
  const taxaAcerto = questoes.length > 0 ? Math.round((acertos / questoes.length) * 100) : null

  const tempos = questoes.map((q) => q.resposta?.tempo_segundos).filter((t): t is number => !!t)
  const tempoMedio = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null

  if (erro) return <ErrorState description={erro} onRetry={() => window.location.reload()} />

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title={`${saudacao()}${profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}`}
        subtitle={dataPorExtenso()}
        actions={
          <Button variant="accent" onClick={() => (window.location.href = "/questoes")}>
            Resolver questões
          </Button>
        }
      />

      {/* ── Faixa 1 · números ──────────────────────────────────── */}
      <Panel flush>
        <div className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2.5 h-6 w-14" />
              </div>
            ))
          ) : (
            <>
              <div className="border-b border-line p-4 md:border-b-0">
                <Stat label="Sequência" value={`${streakCount}d`} hint={`de 7 dias na semana`} />
              </div>
              <div className="border-b border-line p-4 md:border-b-0">
                <Stat label="Questões recentes" value={questoes.length} hint="últimas respondidas" />
              </div>
              <div className="p-4">
                <Stat
                  label="Taxa de acerto"
                  value={taxaAcerto != null ? `${taxaAcerto}%` : "—"}
                  hint={questoes.length ? `${acertos} de ${questoes.length}` : "sem dados ainda"}
                />
              </div>
              <div className="p-4">
                <Stat
                  label="Tempo médio"
                  value={tempoMedio != null ? formatarDuracao(tempoMedio) : "—"}
                  hint="por questão"
                />
              </div>
            </>
          )}
        </div>
      </Panel>

      {/* ── Faixa 2 e 3 · atividade + contexto ─────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AtividadeRecente questoes={questoes} taxa={taxaAcerto} loading={loading} />
        </div>

        <div className="space-y-5">
          <NivelPanel xpTotal={profile?.xp_total ?? 0} />
          <ProvaPanel dataProva={profile?.data_prova ?? null} loading={loading} />
          <SemanaPanel dias={streak} diaIdx={diaIdx} loading={loading} />
          {material && <SugestaoPanel material={material} />}
        </div>
      </div>
    </div>
  )
}

/* ── Atividade ──────────────────────────────────────────────── */

function AtividadeRecente({
  questoes,
  taxa,
  loading,
}: {
  questoes: QuestaoDoDia[]
  taxa: number | null
  loading: boolean
}) {
  return (
    <Panel flush className="flex h-full flex-col">
      <PanelHeader
        title="Atividade recente"
        actions={taxa != null && <Badge tone={taxa >= 70 ? "positive" : "caution"}>{taxa}% de acerto</Badge>}
      />

      <div className="flex-1">
        {loading ? (
          <ul>
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3" style={{ width: `${72 - i * 8}%` }} />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </li>
            ))}
          </ul>
        ) : questoes.length === 0 ? (
          <EmptyState
            icon={<FileQuestion size={16} strokeWidth={1.75} />}
            title="Nenhuma questão respondida ainda"
            description="Comece por uma sessão curta — dez questões já mostram onde você está."
            action={
              <Button variant="secondary" onClick={() => (window.location.href = "/questoes")}>
                Começar agora
              </Button>
            }
          />
        ) : (
          <ul>
            {questoes.map((q) => {
              const correto = q.resposta?.correto
              return (
                <li
                  key={q.id}
                  className="flex items-start gap-3 border-b border-line px-4 py-3 transition-colors duration-fast last:border-0 hover:bg-surface-hover"
                >
                  {/* Ícone + cor: quem não distingue verde de vermelho lê o
                      símbolo. */}
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                      correto ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative"
                    )}
                  >
                    {correto ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-fg">{q.enunciado}</p>
                    <p className="mt-1 text-xs text-fg-subtle">
                      <span className="sr-only">{correto ? "Acertou. " : "Errou. "}</span>
                      {q.banca || "Banca"}
                      {q.ano ? ` · ${q.ano}` : ""}
                      {q.resposta?.tempo_segundos
                        ? ` · ${formatarDuracao(q.resposta.tempo_segundos)}`
                        : ""}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <PanelFooter>
        <Link
          href="/questoes/historico"
          className="inline-flex items-center gap-1 text-sm font-medium text-fg-muted transition-colors duration-fast hover:text-fg"
        >
          Ver histórico completo
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      </PanelFooter>
    </Panel>
  )
}

/* ── Prova ──────────────────────────────────────────────────── */

/**
 * Contagem regressiva até a prova (profiles.data_prova — guardada no
 * onboarding e até agora nunca exibida). Sem data, vira o convite
 * para defini-la: a contagem só existe se a data existir.
 */
function ProvaPanel({ dataProva, loading }: { dataProva: string | null; loading: boolean }) {
  if (loading) {
    return (
      <Panel>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-20" />
        <Skeleton className="mt-2 h-3 w-36" />
      </Panel>
    )
  }

  if (!dataProva) {
    return (
      <Panel>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-fg">Dia da prova</h3>
        </div>
        <p className="mt-2 text-sm text-fg-subtle">
          Defina a data da sua prova para acompanhar a contagem e ajustar o plano de estudos.
        </p>
        <Button
          variant="secondary"
          className="mt-3"
          size="sm"
          onClick={() => (window.location.href = "/onboarding")}
        >
          Definir data da prova
        </Button>
      </Panel>
    )
  }

  const dias = diasAte(dataProva)
  const dataFormatada = new Date(`${dataProva}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-fg">Dia da prova</h3>
        {dias >= 0 && dias <= 30 ? (
          <Badge tone="caution">Reta final</Badge>
        ) : (
          <Badge>Ritmo constante</Badge>
        )}
      </div>

      {dias < 0 ? (
        <>
          <p className="mt-3 text-2xl font-semibold text-fg">Boa prova!</p>
          <p className="mt-1 text-xs text-fg-subtle">Sua prova foi em {dataFormatada}.</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-4xl font-semibold tabular-nums text-fg">
            {dias}
            <span className="ml-1.5 text-sm font-normal text-fg-subtle">
              {dias === 1 ? "dia" : "dias"}
            </span>
          </p>
          <p className="mt-1 text-xs text-fg-subtle">
            {dias === 0 ? "é hoje · " : ""}
            {dataFormatada}
          </p>
          {dias > 0 && dias <= 30 && (
            <p className="mt-2 text-xs text-fg-muted">
              Último mês: priorize revisão e simulados cronometrados.
            </p>
          )}
        </>
      )}
    </Panel>
  )
}

/* ── Semana ─────────────────────────────────────────────────── */

function SemanaPanel({ dias, diaIdx, loading }: { dias: boolean[]; diaIdx: number; loading: boolean }) {
  const feitos = dias.filter(Boolean).length

  return (
    <Panel>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-fg">Sua semana</h3>
        <span className="text-xs tabular-nums text-fg-subtle">{feitos}/7</span>
      </div>

      <Progress value={feitos} max={7} className="mt-3" label={`${feitos} de 7 dias estudados`} />

      <div className="mt-4 flex justify-between gap-1">
        {dias.map((ativo, i) => {
          const isHoje = i === diaIdx
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              {loading ? (
                <Skeleton className="h-7 w-full rounded-md" />
              ) : (
                <span
                  title={ativo ? "Estudou" : "Sem registro"}
                  className={cn(
                    "h-7 w-full rounded-md border transition-colors duration-DEFAULT",
                    ativo ? "border-accent bg-accent" : "border-line bg-surface-sunken",
                    isHoje && !ativo && "border-accent-ink border-dashed"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-2xs",
                  isHoje ? "font-semibold text-fg" : "text-fg-faint"
                )}
              >
                {diasSemana[i]}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

/* ── Sugestão ───────────────────────────────────────────────── */

function SugestaoPanel({ material }: { material: Material }) {
  return (
    <Panel className="group" interactive>
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-medium uppercase tracking-wide text-fg-faint">
          Sugerido para você
        </span>
        {material.incidencia_pct != null && (
          <Badge tone="accent" size="sm">
            {material.incidencia_pct}% de incidência
          </Badge>
        )}
      </div>

      <h3 className="mt-2 text-base font-semibold leading-snug text-fg">{material.titulo}</h3>

      <p className="mt-1 text-sm text-fg-subtle">
        {[material.materia, material.banca, material.professor && `Prof. ${material.professor}`]
          .filter(Boolean)
          .join(" · ")}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-xs text-fg-faint">
          {material.paginas ? `${material.paginas} páginas` : "PDF"}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
          Abrir
          <ArrowUpRight
            size={13}
            strokeWidth={2}
            className="transition-transform duration-DEFAULT group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Panel>
  )
}

/* ── Utilidades locais ──────────────────────────────────────── */

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function dataPorExtenso() {
  const texto = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatarDuracao(segundos: number) {
  if (segundos < 60) return `${segundos}s`
  const min = Math.floor(segundos / 60)
  const seg = segundos % 60
  return seg ? `${min}m ${seg}s` : `${min}m`
}
