"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { toast } from "sonner"
import { CalendarDays, Check, Lock, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { resolveApiUrl } from "@/lib/fetch-utils"
import { cn } from "@/lib/utils"
import { AREAS } from "@/lib/constants"
import { CONCURSOS, encontrarConcurso } from "@/lib/gerar-plano/planos-concursos"
import type { DiaPlano, SemanaPlano } from "@/lib/gerar-plano/gerar-plano"
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
 * Plano de estudos por semanas.
 *
 * O plano cobre todas as semanas até a prova e é liberado aos poucos:
 * a semana liberada (`planos_estudo.semana_liberada`) é a única
 * editável; as seguintes aparecem com cadeado e abrem quando a anterior
 * é concluída (ou quando a data dela passa). Quem voltava depois e via
 * "undefined semanas restantes" era o sintoma de metadados que não eram
 * salvos — aqui tudo que aparece vem do banco.
 *
 * A barra falsa de progresso durante a geração também saiu: enchia até
 * 85% num timer e travava lá, o que faz a espera parecer defeito.
 */

const DIAS_ABREV: Record<string, string> = {
  Segunda: "Seg",
  Terça: "Ter",
  Quarta: "Qua",
  Quinta: "Qui",
  Sexta: "Sex",
  Sábado: "Sáb",
  Domingo: "Dom",
}

const DIAS_CURTOS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

function diasAte(data: string): number {
  if (!data) return 0
  const prova = new Date(data + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((prova.getTime() - hoje.getTime()) / 86_400_000))
}

interface PlanoCarregado {
  planoId: string
  concurso: string
  areaConcurso: string
  dataProva: string
  horasPorDia: number
  semanasTotal: number
  semanaLiberada: number
  semanas: SemanaPlano[]
}

export default function PlanoPage() {
  const supabase = createClient()
  const [plano, setPlano] = useState<PlanoCarregado | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [area, setArea] = useState<(typeof AREAS)[number]>("Concursos Gerais")
  const [concurso, setConcurso] = useState("")
  const [modoManual, setModoManual] = useState(false)
  const [dataProva, setDataProva] = useState("")
  const [semData, setSemData] = useState(false)
  const [horas, setHoras] = useState(4)
  const [gerando, setGerando] = useState(false)
  const [semanaAtiva, setSemanaAtiva] = useState(0)
  const [diaAtivo, setDiaAtivo] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Área do perfil para pré-selecionar a curadoria.
        const { data: perfil } = await supabase
          .from("profiles")
          .select("area_concurso, concurso_alvo")
          .eq("id", user.id)
          .single()
        if (perfil?.area_concurso) setArea(perfil.area_concurso as typeof area)
        if (perfil?.concurso_alvo) {
          setConcurso(perfil.concurso_alvo)
          setModoManual(!encontrarConcurso(perfil.concurso_alvo))
        }

        const { data: planoRow } = await supabase
          .from("planos_estudo")
          .select("id, concurso, area_concurso, data_prova, horas_por_dia, semanas_total, semana_liberada")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!planoRow) return

        const { data: semanas } = await supabase
          .from("plano_semanas")
          .select("numero, semana_inicio, foco, tarefas, concluido")
          .eq("plano_id", planoRow.id)
          .order("numero", { ascending: true })

        if (!semanas?.length) return

        setPlano({
          planoId: planoRow.id,
          concurso: planoRow.concurso,
          areaConcurso: planoRow.area_concurso,
          dataProva: planoRow.data_prova,
          horasPorDia: planoRow.horas_por_dia,
          semanasTotal: planoRow.semanas_total,
          semanaLiberada: planoRow.semana_liberada,
          semanas: semanas.map((s) => ({
            numero: s.numero,
            semanaInicio: s.semana_inicio,
            foco: s.foco,
            concluido: s.concluido,
            dias: s.tarefas as unknown as DiaPlano[],
          })),
        })
        setSemanaAtiva(planoRow.semana_liberada - 1)
      } catch {
        // Ausência de plano não é erro — é o estado inicial de quem
        // ainda não gerou nenhum.
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  // Na carga, a semana cuja data já passou abre sozinha (quem perdeu o
  // ritmo não fica preso). Idempotente: liberar de novo não muda nada.
  useEffect(() => {
    const planoAtual = plano
    if (!planoAtual) return
    const { planoId, semanaLiberada } = planoAtual
    async function liberarAutomatica() {
      const res = await fetch(resolveApiUrl("/api/plano/desbloquear-semana"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId }),
      })
      if (res.ok) {
        const { liberada } = await res.json()
        if (liberada > semanaLiberada) {
          setPlano((p) =>
            p
              ? {
                  ...p,
                  semanaLiberada: liberada,
                  semanas: p.semanas.map((s) =>
                    s.numero < liberada ? { ...s, concluido: true } : s
                  ),
                }
              : p
          )
          setSemanaAtiva(liberada - 1)
        }
      }
    }
    liberarAutomatica()
  }, [plano])

  const handleGerar = useCallback(async () => {
    if (!concurso.trim()) {
      toast.error("Escolha o concurso para gerar o plano.")
      return
    }
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

      const gerado = await res.json()
      setPlano({
        planoId: gerado.planoId,
        concurso: gerado.concurso,
        areaConcurso: gerado.areaConcurso,
        dataProva: gerado.dataProva,
        horasPorDia: gerado.horasPorDia,
        semanasTotal: gerado.semanasTotal,
        semanaLiberada: 1,
        semanas: gerado.semanas,
      })
      setSemanaAtiva(0)
      setDiaAtivo(0)
    } catch {
      toast.error("Falha de conexão ao gerar o plano.")
    } finally {
      setGerando(false)
    }
  }, [concurso, dataProva, horas])

  const toggleTarefa = useCallback(
    async (tarefaIdx: number) => {
      if (!plano) return
      const semana = plano.semanas[semanaAtiva]
      if (!semana || semana.numero > plano.semanaLiberada) return

      const novosDias = semana.dias.map((d, i) =>
        i !== diaAtivo
          ? d
          : {
              ...d,
              tarefas: d.tarefas.map((t, j) =>
                j !== tarefaIdx ? t : { ...t, concluido: !t.concluido }
              ),
            }
      )

      setPlano({
        ...plano,
        semanas: plano.semanas.map((s) => (s.numero === semana.numero ? { ...s, dias: novosDias } : s)),
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("plano_semanas")
        .update({ tarefas: novosDias })
        .eq("plano_id", plano.planoId)
        .eq("numero", semana.numero)
      if (error) toast.error("Não foi possível salvar essa marcação.")

      // Semana completa → tenta liberar a próxima na hora.
      const todas = novosDias.every((d) => d.tarefas.every((t) => t.concluido))
      if (todas) {
        const res = await fetch(resolveApiUrl("/api/plano/desbloquear-semana"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planoId: plano.planoId }),
        })
        if (res.ok) {
          const { liberada } = await res.json()
          if (liberada > plano.semanaLiberada) {
            setPlano((p) =>
              p
                ? {
                    ...p,
                    semanaLiberada: liberada,
                    semanas: p.semanas.map((s) =>
                      s.numero < liberada ? { ...s, concluido: true } : s
                    ),
                  }
                : p
            )
            setSemanaAtiva(liberada - 1)
            setDiaAtivo(0)
          }
        }
      }
    },
    [plano, semanaAtiva, diaAtivo, supabase]
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
    const podeAvancar = [Boolean(concurso.trim()), Boolean(dataProva) || semData, true][step]
    const restantes = diasAte(dataProva)
    const curadosDaArea = CONCURSOS.filter((c) => c.area === area)

    return (
      <div className="animate-rise space-y-6">
        <PageHeader
          title="Monte seu cronograma"
          subtitle="Escolha o concurso e a IA organiza suas semanas até a prova."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
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
                      <Field label="Qual concurso você vai prestar?">
                        {(props) => (
                          <Input
                            {...props}
                            className="h-10"
                            placeholder={modoManual ? "Ex.: Polícia Federal, TRT-SP, OAB…" : "Pesquisar…"}
                            value={concurso}
                            readOnly={!modoManual}
                            onChange={(e) => setConcurso(e.target.value)}
                          />
                        )}
                      </Field>

                      <div className="flex flex-wrap gap-1.5">
                        {AREAS.map((a) => (
                          <button
                            key={a}
                            onClick={() => setArea(a)}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              "transition-colors duration-fast",
                              area === a
                                ? "border-line-accent bg-accent-soft font-medium text-fg"
                                : "border-line-strong text-fg-muted hover:bg-surface-hover hover:text-fg"
                            )}
                          >
                            {a}
                          </button>
                        ))}
                      </div>

                      <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                        {curadosDaArea.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setConcurso(c.nome)
                              setModoManual(false)
                            }}
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs",
                              "transition-colors duration-fast",
                              concurso === c.nome && !modoManual
                                ? "border-line-accent bg-accent-soft font-medium text-fg"
                                : "border-line-strong text-fg-muted hover:bg-surface-hover hover:text-fg"
                            )}
                          >
                            {c.nome}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setModoManual((v) => !v)
                          if (!modoManual) setConcurso("")
                        }}
                        className="text-xs font-medium text-accent-ink underline-offset-2 hover:underline"
                      >
                        {modoManual ? "Voltar para a lista" : "Meu concurso não está na lista"}
                      </button>
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
                        Com {horas}h por dia, o plano fica montado até a data da prova —
                        você libera as semanas conforme conclui.
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
                Distribuindo as matérias pelas semanas até a prova. Leva alguns segundos.
              </p>
            )}
          </div>

          <Panel className="h-fit lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-fg">O que você recebe</h2>
            <ul className="mt-3 space-y-2.5">
              {[
                "Plano semana a semana até a prova",
                "Matérias priorizadas pela banca do concurso",
                "Próxima semana libera ao concluir a atual",
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
  const semana = plano.semanas[semanaAtiva]
  const totalTarefas = plano.semanas.reduce(
    (acc, s) => acc + s.dias.reduce((a, d) => a + d.tarefas.length, 0),
    0
  )
  const concluidas = plano.semanas.reduce(
    (acc, s) => acc + s.dias.reduce((a, d) => a + d.tarefas.filter((t) => t.concluido).length, 0),
    0
  )
  const progresso = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0
  const dias = semana?.dias ?? []
  const dia = dias[diaAtivo] ?? dias[0]

  return (
    <div className="animate-rise space-y-5">
      <PageHeader
        title="Seu cronograma"
        subtitle={
          plano.concurso
            ? `Preparação para ${plano.concurso} · ${plano.semanasTotal} semanas`
            : "Plano semanal"
        }
        actions={
          <Button variant="secondary" onClick={() => setPlano(null)}>
            Refazer plano
          </Button>
        }
      />

      <Panel>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Progresso do plano</h2>
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
          <span>Semana liberada: {plano.semanaLiberada} de {plano.semanasTotal}</span>
        </div>
      </Panel>

      {/* Semanas: liberada editável, concluída com check, seguintes com cadeado. */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {plano.semanas.map((s, i) => {
          const liberada = s.numero <= plano.semanaLiberada
          const ativa = semanaAtiva === i
          return (
            <button
              key={s.numero}
              onClick={() => {
                if (!liberada) return
                setSemanaAtiva(i)
                setDiaAtivo(0)
              }}
              disabled={!liberada}
              aria-current={ativa ? "true" : undefined}
              title={liberada ? s.foco : "Conclua a semana anterior para liberar"}
              className={cn(
                "flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2",
                "transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                !liberada && "cursor-not-allowed opacity-45",
                ativa
                  ? "border-transparent bg-accent text-fg-on-accent"
                  : s.concluido
                    ? "border-line-accent bg-accent-soft text-accent-ink"
                    : "border-line bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg"
              )}
            >
              <span className="text-xs font-medium">Sem {s.numero}</span>
              <span className="text-2xs tabular-nums opacity-80">
                {s.concluido ? "✓" : liberada ? s.numero : <Lock size={10} strokeWidth={2} />}
              </span>
            </button>
          )
        })}
      </div>

      {/* Dias dentro da semana liberada. */}
      {semana && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {dias.map((d, i) => {
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
                <span className="text-xs font-medium">{DIAS_CURTOS[i] ?? d.dia}</span>
                <span className="text-2xs tabular-nums opacity-80">
                  {completo ? "✓" : `${d.tarefas.length}`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {semana ? (
        <Panel flush>
          <PanelHeader
            title={`Semana ${semana.numero} · ${semana.foco}`}
            description={`${dia.totalHoras}h planejadas · semana começa ${formatarData(semana.semanaInicio)}`}
            actions={
              <Badge size="sm" tone={semana.concluido ? "positive" : "neutral"}>
                {semana.concluido ? "Concluída" : `${dia.tarefas.length} tarefas`}
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
                      onChange={() => toggleTarefa(i)}
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
      ) : (
        <Panel>
          <div className="px-4 py-10 text-center text-sm text-fg-subtle">
            Nenhuma semana disponível.
          </div>
        </Panel>
      )}
    </div>
  )
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR")
}