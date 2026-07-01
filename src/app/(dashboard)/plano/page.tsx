"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import PageHeader from "@/components/PageHeader"
import { Check } from "lucide-react"

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
  concurso: string
  dataProva: string
  horasPorDia: number
  semanasRestantes: number
  diasRestantes: number
  dias: DiaPlano[]
  geradoEm: string
}

const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
const DIAS_ABREV: Record<string, string> = {
  Segunda: "S", Terça: "T", Quarta: "Q", Quinta: "Q", Sexta: "S", Sábado: "S", Domingo: "D",
}

const sugestoesConcursos = [
  "Polícia Federal", "TRT", "INSS", "OAB", "PGM", "TCE",
]

function calcularDiasRestantes(dataProva: string): number {
  if (!dataProva) return 0
  const hoje = new Date()
  const prova = new Date(dataProva)
  const diff = prova.getTime() - hoje.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function PlanoPage() {
  const supabase = createClient()
  const router = useRouter()
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")
  const [step, setStep] = useState(0)
  const [concurso, setConcurso] = useState("")
  const [dataProva, setDataProva] = useState("")
  const [semData, setSemData] = useState(false)
  const [horas, setHoras] = useState(4)
  const [gerando, setGerando] = useState(false)
  const [progressoGeracao, setProgressoGeracao] = useState(0)
  const [diaAtivo, setDiaAtivo] = useState(0)

  const diasRestantes = calcularDiasRestantes(dataProva)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
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

        if (data) {
          setPlano({ dias: data.tarefas as unknown as DiaPlano[] } as Plano)
        }
      } catch {
        setErro("Não foi possível carregar o plano")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const handleGerar = useCallback(async () => {
    setGerando(true)
    setProgressoGeracao(0)

    const timer = setInterval(() => {
      setProgressoGeracao((prev) => Math.min(prev + 2, 85))
    }, 60)

    const today = new Date()
    const dataFim = dataProva || new Date(today.setDate(today.getDate() + 180)).toISOString().split("T")[0]

    const body = { concurso, dataProva: dataFim, horasPorDia: horas }

    const res = await fetch("/api/gerar-plano", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    clearInterval(timer)
    setProgressoGeracao(100)

    setTimeout(async () => {
      if (res.ok) {
        const data = await res.json()
        setPlano(data)
      }
      setGerando(false)
    }, 500)
  }, [concurso, dataProva, horas])

  const toggleTarefa = useCallback(async (diaIdx: number, tarefaIdx: number) => {
    if (!plano) return
    const novosDias = [...plano.dias]
    const tarefas = [...novosDias[diaIdx].tarefas]
    tarefas[tarefaIdx] = { ...tarefas[tarefaIdx], concluido: !tarefas[tarefaIdx].concluido }
    novosDias[diaIdx] = { ...novosDias[diaIdx], tarefas }
    setPlano({ ...plano, dias: novosDias })

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase
        .from("study_plans")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        await supabase
          .from("study_plans")
          .update({ tarefas: novosDias })
          .eq("id", existing.id)
      }
    }
  }, [plano, supabase])

  async function handleReplanejar() {
    setPlano(null)
    setStep(0)
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive text-sm">{erro}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted text-sm animate-pulse">Carregando plano...</div>
      </div>
    )
  }

  // ── ONBOARDING / WIZARD (2 colunas) ──
  if (!plano) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col lg:flex-row gap-8"
      >
        {/* COLUNA ESQUERDA — WIZARD */}
        <div className="flex-1 lg:max-w-[60%] space-y-6">
          <PageHeader
            badge="PLANO"
            title="Monte seu cronograma"
            subtitle="Responda 3 perguntas e a IA cria seu plano personalizado"
          />

          {/* PROGRESSO DO WIZARD */}
          <div className="space-y-2">
            <div className="flex gap-0">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1">
                  <div
                    className={`h-[3px] transition-colors ${
                      i <= step ? "bg-accent" : "bg-card-border"
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {["01 Concurso", "02 Data", "03 Horas"].map((label, i) => (
                <span
                  key={i}
                  className={`text-[10px] uppercase tracking-wider ${
                    i === step ? "text-accent font-semibold" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* WIZARD STEPS */}
          <div className="bg-card border border-card-border rounded-card p-5">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="text-xs text-muted uppercase tracking-wider">
                    CONCURSO ALVO
                  </label>
                  <input
                    type="text"
                    value={concurso}
                    onChange={(e) => setConcurso(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-card px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                    placeholder="Ex: Polícia Federal, TRT-SP, OAB..."
                  />
                  <div className="flex flex-wrap gap-2">
                    {sugestoesConcursos.map((s) => (
                      <button
                        key={s}
                        onClick={() => setConcurso(s)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs transition-all ${
                          concurso === s
                            ? "border-accent bg-badge-bg text-accent"
                            : "border-card-border text-muted hover:border-accent"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    disabled={!concurso.trim()}
                    className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:opacity-88 transition-opacity disabled:opacity-30"
                  >
                    CONTINUAR →
                  </button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <label className="text-xs text-muted uppercase tracking-wider">
                    DATA DA PROVA
                  </label>
                  <input
                    type="date"
                    value={dataProva}
                    onChange={(e) => {
                      setDataProva(e.target.value)
                      setSemData(false)
                    }}
                    disabled={semData}
                    className="w-full bg-background border border-card-border rounded-card px-4 py-3.5 text-[15px] text-foreground focus:outline-none focus:border-accent transition-colors [color-scheme:dark] disabled:opacity-30"
                  />
                  {dataProva && !semData && (
                    <p className="text-sm font-bold text-accent">
                      Faltam {diasRestantes} dias
                    </p>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={semData}
                      onChange={(e) => setSemData(e.target.checked)}
                      className="w-4 h-4 accent-[#CBFF4D]"
                    />
                    <span className="text-xs text-muted">Ainda não sei a data</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(0)}
                      className="flex-1 bg-transparent border border-card-border text-[#888888] font-semibold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:border-[#3A3A3A] hover:text-foreground transition-all"
                    >
                      ← VOLTAR
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!dataProva && !semData}
                      className="flex-1 bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:opacity-88 transition-opacity disabled:opacity-30"
                    >
                      CONTINUAR →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <label className="text-xs text-muted uppercase tracking-wider">
                    HORAS DISPONÍVEIS POR DIA
                  </label>

                  <div className="text-center">
                    <span className="text-[32px] font-[800] text-accent">{horas}h</span>
                    <span className="text-sm text-muted ml-2">/ dia</span>
                  </div>

                  <div className="relative">
                    <div className="w-full h-1.5 bg-card-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${((horas - 1) / 7) * 100}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={0.5}
                      value={horas}
                      onChange={(e) => setHoras(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-accent rounded-full pointer-events-none transition-all"
                      style={{
                        left: `calc(${((horas - 1) / 7) * 100}% - 10px)`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted">
                    <span>1h</span>
                    <span>8h</span>
                  </div>

                  <p className="text-sm text-muted text-center">
                    Estimativa: <span className="font-semibold text-foreground">~{Math.max(4, Math.round(180 / horas))} semanas</span> de estudo
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-transparent border border-card-border text-[#888888] font-semibold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:border-[#3A3A3A] hover:text-foreground transition-all"
                    >
                      ← VOLTAR
                    </button>
                    <button
                      onClick={handleGerar}
                      disabled={gerando}
                      className="flex-1 bg-accent text-accent-foreground font-bold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:opacity-88 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {gerando ? (
                        "GERANDO..."
                      ) : (
                        <>
                          ⚡ GERAR MEU PLANO →
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ESTADO DE GERAÇÃO */}
          {gerando && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-card-border rounded-card p-5 space-y-4"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted">Analisando o edital e montando seu plano...</span>
              </div>
              <div className="w-full h-1.5 bg-card-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-200"
                  style={{ width: `${progressoGeracao}%` }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* COLUNA DIREITA — PREVIEW */}
        <div className="lg:w-[35%] lg:min-w-[280px]">
          <div className="bg-card border border-card-border rounded-card p-5 space-y-4 sticky top-8">
            <span className="inline-block px-2 py-0.5 rounded-md bg-[#66666620] text-muted border border-[#66666640] text-[10px] font-semibold uppercase font-mono tracking-wider">
              O QUE VOCÊ VAI RECEBER
            </span>

            <div className="space-y-3">
              {[
                "Cronograma semanal por matéria",
                "Priorização por incidência na banca",
                "Materiais selecionados pela IA",
                "Metas diárias ajustáveis",
                "Replanejamento automático",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <Check size={14} className="text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-[13px] text-muted">{item}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-card-border pt-4">
              <div className="bg-background border border-card-border rounded-card p-4 space-y-2 relative overflow-hidden">
                <div className="flex gap-2">
                  {["S", "T", "Q", "Q", "S", "S", "D"].map((d) => (
                    <div key={d} className="flex-1 h-16 rounded-md bg-accent/10 border border-card-border" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">
                    SEU PLANO APARECERÁ AQUI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── VISUALIZAÇÃO DO PLANO ──
  const dia = plano.dias[diaAtivo]
  const totalTarefas = plano.dias.reduce((acc, d) => acc + d.tarefas.length, 0)
  const concluidas = plano.dias.reduce((acc, d) => acc + d.tarefas.filter((t) => t.concluido).length, 0)
  const progresso = totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-md bg-[#66666620] text-muted border border-[#66666640] text-[10px] font-semibold uppercase font-mono tracking-wider">
            PLANO
          </span>
          <h1 className="text-[28px] font-[800] text-foreground leading-tight mt-1.5">
            Seu cronograma personalizado
          </h1>
          <p className="text-[14px] text-muted mt-1">{plano.concurso}</p>
        </div>
        <button
          onClick={handleReplanejar}
          className="text-xs text-muted hover:text-accent transition-colors mt-1"
        >
          REPLANEJAR
        </button>
      </div>

      {/* PROGRESSO */}
      <div className="bg-card border border-card-border rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-mono">Progresso da semana</span>
          <span className="text-sm font-bold text-accent">{progresso}%</span>
        </div>
        <div className="w-full h-2 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{concluidas} de {totalTarefas} tarefas</span>
          <span>{plano.semanasRestantes} semanas restantes</span>
        </div>
      </div>

      {/* DIAS DA SEMANA */}
      <div className="flex items-center gap-1.5">
        {plano.dias.map((d, i) => {
          const concluido = d.tarefas.length > 0 && d.tarefas.every((t) => t.concluido)
          return (
            <button
              key={d.dia}
              onClick={() => setDiaAtivo(i)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-card transition-all ${
                diaAtivo === i
                  ? "bg-accent text-accent-foreground font-bold"
                  : concluido
                  ? "bg-badge-bg text-accent"
                  : "bg-card border border-card-border text-muted hover:text-foreground"
              }`}
            >
              <span className="text-xs font-bold">{DIAS_ABREV[d.dia]}</span>
              {concluido && <span className="text-[9px]">✓</span>}
            </button>
          )
        })}
      </div>

      {/* TAREFAS DO DIA */}
      <div className="bg-card border border-card-border rounded-card overflow-hidden">
        <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {dia.dia} · {dia.totalHoras}h
          </h3>
          <span className="text-[11px] text-muted">
            {dia.tarefas.filter((t) => t.concluido).length}/{dia.tarefas.length}
          </span>
        </div>

        <div className="divide-y divide-[#2A2A2A]/50">
          {dia.tarefas.map((tarefa, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <button
                onClick={() => toggleTarefa(diaAtivo, i)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  tarefa.concluido
                    ? "bg-accent border-accent"
                    : "border-card-border hover:border-accent"
                }`}
              >
                {tarefa.concluido && (
                  <svg className="w-3 h-3 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${tarefa.concluido ? "text-muted line-through" : "text-foreground"}`}>
                  {tarefa.descricao}
                </p>
                <span className="text-[11px] text-muted">{tarefa.materia} · {tarefa.horas}h</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
