"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { CalendarDays, Check, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { resolveApiUrl } from "@/lib/fetch-utils"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import {
  Badge,
  Button,
  Checkbox,
  Field,
  Input,
  Panel,
  PanelHeader,
  Progress,
  Skeleton,
} from "@/components/ui"

/**
 * Plano de estudos.
 *
 * O bug que motivou a reescrita: a tabela `study_plans` guarda apenas
 * `tarefas`. Concurso, semanas restantes e horas por dia existiam só na
 * memória de quem acabara de gerar o plano — quem voltava no dia seguinte
 * via "undefined semanas restantes" no cabeçalho.
 *
 * A tela agora deriva tudo do que está salvo (dias e tarefas) e só mostra
 * os metadados quando eles existem de fato, na sessão da geração. O que
 * ela ganhou em troca é uma informação melhor: horas planejadas e horas
 * concluídas, que saem das próprias tarefas.
 *
 * A barra falsa de progresso durante a geração também saiu: enchia até
 * 85% num timer e travava lá, o que faz a espera parecer defeito.
 */

interface Tarefa {
  materia: string
  descricao: string
  horas: number
  concluido: boolean
  ordem: number
}

interface DiaPlano {
  dia: string
  tarefas: Tarefa[]
  totalHoras: number
}

interface Plano {
  dias: DiaPlano[]
  /** Só presente na sessão em que o plano foi gerado. */
  concurso?: string
  semanasRestantes?: number
}

const DIAS_ABREV: Record<string, string> = {
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
  Sábado: "Sáb",
  Domingo: "Dom",
}

const SUGESTOES = ["Polícia Federal", "TRT", "INSS", "OAB", "PGM", "TCE"]

function diasAte(data: string): number {
  if (!data) return 0
  const prova = new Date(data + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((prova.getTime() - hoje.getTime()) / 86_400_000))
}

export default function PlanoPage() {
  const supabase = createClient()
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [concurso, setConcurso] = useState("")
  const [dataProva, setDataProva] = useState("")
  const [semData, setSemData] = useState(false)
  const [horas, setHoras] = useState(4)
  const [gerando, setGerando] = useState(false)
  const [diaAtivo, setDiaAtivo] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const hoje = new Date().toISOString().split("T")[0]
        const { data } = await supabase
          .from("study_plans")
          .select("*")
          .eq("user_id", user.id)
          .gte("semana_inicio", hoje)
          .order("semana_inicio", { ascending: false })
          .limit(1)
          .single()

        if (data?.tarefas) setPlano({ dias: data.tarefas as unknown as DiaPlano[] })
      } catch {
        // Ausência de plano não é erro — é o estado inicial de quem
        // ainda não gerou nenhum.
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const handleGerar = useCallback(async () => {
    setGerando(true)

    const base = new Date()
    const dataFim =
      dataProva || new Date(base.setDate(base.getDate() + 180)).toISOString().split("T")[0]

    try {
      const res = await fetch(resolveApiUrl("/api/gerar-plano"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concurso, dataProva: dataFim, horasPorDia: horas }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}))
        toast.error(erro.error || "Não foi possível gerar o plano. Tente novamente.")
        return
      }

      setPlano(await res.json())
      setDiaAtivo(0)
    } catch {
      toast.error("Falha de conexão ao gerar o plano.")
    } finally {
      setGerando(false)
    }
  }, [concurso, dataProva, horas])

  const toggleTarefa = useCallback(
    async (diaIdx: number, tarefaIdx: number) => {
      if (!plano) return

      const novosDias = plano.dias.map((d, i) =>
        i !== diaIdx
          ? d
          : {
              ...d,
              tarefas: d.tarefas.map((t, j) =>
                j !== tarefaIdx ? t : { ...t, concluido: !t.concluido }
              ),
            }
      )
      setPlano({ ...plano, dias: novosDias })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from("study_plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        const { error } = await supabase
          .from("study_plans")
          .update({ tarefas: novosDias })
          .eq("id", existing.id)
        // Antes a falha era silenciosa: a marcação sumia no recarregamento
        // sem que ninguém soubesse por quê.
        if (error) toast.error("Não foi possível salvar essa marcação.")
      }
    },
    [plano, supabase]
  )

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  /* ══ Assistente de criação ══════════════════════════════ */
  if (!plano) {
    const podeAvancar = [concurso.trim().length > 0, Boolean(dataProva) || semData, true][step]
    const restantes = diasAte(dataProva)

    return (
      <div className="animate-rise space-y-6">
        <PageHeader
          title="Monte seu cronograma"
          subtitle="Três respostas e a IA organiza suas semanas até a prova."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {/* Passos: rótulo legível em vez de "01 Concurso". */}
            <ol className="flex items-center gap-2">
              {["Concurso", "Data", "Rotina"].map((label, i) => (
                <li key={label} className="flex flex-1 flex-col gap-1.5">
                  <span
                    className={cn(
                      "h-0.5 rounded-full transition-colors duration-DEFAULT",
                      i <= step ? "bg-accent" : "bg-surface-sunken"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      i === step ? "font-medium text-fg" : "text-fg-faint"
                    )}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>

            <Panel>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="space-y-4"
                >
                  {step === 0 && (
                    <>
                      <Field
                        label="Qual concurso você vai prestar?"
                        hint="Quanto mais específico, melhor a priorização das matérias."
                      >
                        {(props) => (
                          <Input
                            {...props}
                            autoFocus
                            className="h-10"
                            placeholder="Ex.: Polícia Federal, TRT-SP, OAB…"
                            value={concurso}
                            onChange={(e) => setConcurso(e.target.value)}
                          />
                        )}
                      </Field>

                      <div className="flex flex-wrap gap-1.5">
                        {SUGESTOES.map((s) => (
                          <button
                            key={s}
                            onClick={() => setConcurso(s)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              "transition-colors duration-fast",
                              concurso === s
                                ? "border-line-accent bg-accent-soft text-fg"
                                : "border-line-strong text-fg-muted hover:bg-surface-hover hover:text-fg"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <Field
                        label="Quando é a prova?"
                        hint={
                          dataProva && !semData
                            ? `Faltam ${restantes} dias.`
                            : "Sem data, o plano é montado para seis meses."
                        }
                      >
                        {(props) => (
                          <Input
                            {...props}
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            className="h-10 [color-scheme:dark]"
                            disabled={semData}
                            value={dataProva}
                            onChange={(e) => {
                              setDataProva(e.target.value)
                              setSemData(false)
                            }}
                          />
                        )}
                      </Field>

                      <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
                        <Checkbox
                          checked={semData}
                          onChange={(e) => {
                            setSemData(e.target.checked)
                            if (e.target.checked) setDataProva("")
                          }}
                        />
                        Ainda não sei a data
                      </label>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <label
                          htmlFor="horas"
                          className="flex items-baseline justify-between text-sm font-medium text-fg"
                        >
                          Horas de estudo por dia
                          <span className="text-lg font-semibold tabular-nums text-fg">
                            {horas}h
                          </span>
                        </label>

                        <input
                          id="horas"
                          type="range"
                          min={1}
                          max={8}
                          step={0.5}
                          value={horas}
                          onChange={(e) => setHoras(parseFloat(e.target.value))}
                          className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-sunken accent-[var(--accent)]"
                          style={{
                            background: `linear-gradient(to right, var(--accent) ${((horas - 1) / 7) * 100}%, var(--surface-sunken) ${((horas - 1) / 7) * 100}%)`,
                          }}
                        />
                        <div className="mt-1.5 flex justify-between text-xs text-fg-faint">
                          <span>1h</span>
                          <span>8h</span>
                        </div>
                      </div>

                      <p className="rounded-md bg-surface-sunken px-3 py-2 text-sm text-fg-muted">
                        Nesse ritmo, cerca de{" "}
                        <strong className="font-medium text-fg">
                          {Math.max(4, Math.round(180 / horas))} semanas
                        </strong>{" "}
                        para cobrir o edital.
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <Button
                  variant="ghost"
                  disabled={step === 0 || gerando}
                  onClick={() => setStep(step - 1)}
                >
                  Voltar
                </Button>

                {step < 2 ? (
                  <Button variant="accent" disabled={!podeAvancar} onClick={() => setStep(step + 1)}>
                    Continuar
                  </Button>
                ) : (
                  <Button variant="accent" loading={gerando} onClick={handleGerar}>
                    <Sparkles size={14} strokeWidth={2} />
                    Gerar meu plano
                  </Button>
                )}
              </div>
            </Panel>

            {gerando && (
              <p className="text-center text-sm text-fg-subtle">
                Analisando o edital e distribuindo as matérias. Leva alguns segundos.
              </p>
            )}
          </div>

          {/* O painel lateral lista o que será entregue — sem a maquete
              falsa de calendário, que prometia uma tela que não existe. */}
          <Panel className="h-fit lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-fg">O que você recebe</h2>
            <ul className="mt-3 space-y-2.5">
              {[
                "Cronograma dia a dia por matéria",
                "Priorização pela incidência na banca",
                "Metas diárias ajustáveis",
                "Progresso salvo automaticamente",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-fg-muted">
                  <Check size={13} strokeWidth={2.5} className="mt-1 shrink-0 text-accent-ink" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    )
  }

  /* ══ Plano gerado ═══════════════════════════════════════ */
  const dia = plano.dias[diaAtivo]
  const totalTarefas = plano.dias.reduce((acc, d) => acc + d.tarefas.length, 0)
  const concluidas = plano.dias.reduce(
    (acc, d) => acc + d.tarefas.filter((t) => t.concluido).length,
    0
  )
  const progresso = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0

  // Derivado das tarefas — não depende de metadados que não são salvos.
  const horasPlanejadas = plano.dias.reduce(
    (acc, d) => acc + d.tarefas.reduce((s, t) => s + (t.horas || 0), 0),
    0
  )
  const horasFeitas = plano.dias.reduce(
    (acc, d) => acc + d.tarefas.filter((t) => t.concluido).reduce((s, t) => s + (t.horas || 0), 0),
    0
  )

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Seu cronograma"
        subtitle={plano.concurso ? `Preparação para ${plano.concurso}` : "Semana atual"}
        actions={
          <Button variant="secondary" onClick={() => setPlano(null)}>
            Refazer plano
          </Button>
        }
      />

      <Panel>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Progresso da semana</h2>
          <span className="text-sm font-medium tabular-nums text-fg">{progresso}%</span>
        </div>

        <Progress
          value={progresso}
          className="mt-3"
          tone={progresso >= 70 ? "positive" : "accent"}
          label={`${concluidas} de ${totalTarefas} tarefas concluídas`}
        />

        <div className="mt-2.5 flex items-center justify-between text-xs tabular-nums text-fg-subtle">
          <span>
            {concluidas} de {totalTarefas} tarefas
          </span>
          <span>
            {horasFeitas}h de {horasPlanejadas}h planejadas
          </span>
        </div>
      </Panel>

      {/* Dias: rótulo de três letras em vez de uma — "S" servia para
          segunda, sexta e sábado ao mesmo tempo. */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {plano.dias.map((d, i) => {
          const completo = d.tarefas.length > 0 && d.tarefas.every((t) => t.concluido)
          const ativo = diaAtivo === i
          return (
            <button
              key={d.dia}
              onClick={() => setDiaAtivo(i)}
              aria-current={ativo ? "true" : undefined}
              className={cn(
                "flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2",
                "transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                ativo
                  ? "border-transparent bg-accent text-fg-on-accent"
                  : completo
                    ? "border-line-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg"
              )}
            >
              <span className="text-xs font-medium">{DIAS_ABREV[d.dia] ?? d.dia}</span>
              <span className="text-2xs tabular-nums opacity-80">
                {completo ? "✓" : `${d.tarefas.length}`}
              </span>
            </button>
          )
        })}
      </div>

      <Panel flush>
        <PanelHeader
          title={dia.dia}
          description={`${dia.totalHoras}h planejadas`}
          actions={
            <Badge size="sm" tone={dia.tarefas.every((t) => t.concluido) ? "positive" : "neutral"}>
              {dia.tarefas.filter((t) => t.concluido).length}/{dia.tarefas.length}
            </Badge>
          }
        />

        {dia.tarefas.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-fg-subtle">
            <CalendarDays size={14} strokeWidth={1.75} />
            Dia livre — sem tarefas planejadas.
          </div>
        ) : (
          <ul>
            {dia.tarefas.map((tarefa, i) => (
              <li key={i} className="border-b border-line last:border-0">
                <label className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors duration-fast hover:bg-surface-hover">
                  <Checkbox
                    className="mt-0.5"
                    checked={tarefa.concluido}
                    onChange={() => toggleTarefa(diaAtivo, i)}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm",
                        tarefa.concluido ? "text-fg-faint line-through" : "text-fg"
                      )}
                    >
                      {tarefa.descricao}
                    </span>
                    <span className="mt-0.5 block text-xs text-fg-subtle">
                      {tarefa.materia} · {tarefa.horas}h
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
