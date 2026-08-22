"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, RotateCcw, Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { MATERIAS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import PageHeader from "@/components/PageHeader"
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Modal,
  Panel,
  PanelHeader,
  Progress,
  Stat,
} from "@/components/ui"

/**
 * Cronômetro de estudo.
 *
 * Três correções de fundo:
 *
 * · o tempo era contado somando 1 a cada tick de `setInterval`. Com a aba
 *   em segundo plano o navegador estrangula o timer e a contagem atrasa —
 *   agora o tempo decorrido é calculado a partir de um instante de
 *   referência, então o valor está certo mesmo depois de horas fora;
 * · o botão de reiniciar zerava a sessão sem perguntar, ao lado do botão
 *   mais clicado da tela. Passou a confirmar;
 * · a matéria era escolhida num modal antes de iniciar, o que impedia
 *   simplesmente começar a contar. Agora o cronômetro parte na hora e a
 *   matéria é escolhida ao salvar, que é quando ela realmente importa.
 */

interface StudySession {
  id: string
  materia: string
  tempo_minutos: number
  registrado_em: string
}

const META_DIARIA_MIN = 240

export default function CronometroPage() {
  const supabase = createClient()
  const [decorrido, setDecorrido] = useState(0)
  const [rodando, setRodando] = useState(false)
  const [sessoes, setSessoes] = useState<StudySession[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalSalvarAberto, setModalSalvarAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmarReset, setConfirmarReset] = useState(false)
  const [materia, setMateria] = useState<string>(MATERIAS[0])

  // Âncora de tempo real: imune ao estrangulamento de timers em abas
  // inativas, ao contrário de um contador incrementado por tick.
  const inicioRef = useRef<number | null>(null)
  const acumuladoRef = useRef(0)

  useEffect(() => {
    let active = true

    async function carregar() {
      const hoje = new Date()
      const inicioDia = new Date(hoje)
      inicioDia.setHours(0, 0, 0, 0)
      const fimDia = new Date(hoje)
      fimDia.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from("study_sessions")
        .select("id, materia, tempo_minutos, registrado_em")
        .gte("registrado_em", inicioDia.toISOString())
        .lte("registrado_em", fimDia.toISOString())
        .order("registrado_em", { ascending: false })

      if (!active) return
      setSessoes((data as StudySession[]) ?? [])
      setCarregando(false)
    }

    carregar().catch((err) => {
      console.error("Erro ao carregar sessões:", err)
      if (active) setCarregando(false)
    })

    return () => {
      active = false
    }
  }, [supabase])

  useEffect(() => {
    if (!rodando) return
    const id = setInterval(() => {
      const base = inicioRef.current ?? Date.now()
      setDecorrido(acumuladoRef.current + Math.floor((Date.now() - base) / 1000))
    }, 250)
    return () => clearInterval(id)
  }, [rodando])

  function alternar() {
    if (rodando) {
      acumuladoRef.current = decorrido
      inicioRef.current = null
      setRodando(false)
    } else {
      inicioRef.current = Date.now()
      setRodando(true)
    }
  }

  function zerar() {
    acumuladoRef.current = 0
    inicioRef.current = null
    setDecorrido(0)
    setRodando(false)
    setConfirmarReset(false)
  }

  async function salvar() {
    const minutos = Math.floor(decorrido / 60)
    if (minutos < 1) {
      toast.error("A sessão precisa de pelo menos um minuto")
      return
    }
    setSalvando(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Sessão expirada. Faça login novamente")
      setSalvando(false)
      return
    }
    const { data, error } = await supabase
      .from("study_sessions")
      .insert({ user_id: user.id, materia, tempo_minutos: minutos })
      .select("id")
      .single()

    if (error || !data) {
      console.error("Erro ao salvar sessão:", error)
      toast.error("Não foi possível salvar a sessão")
      setSalvando(false)
      return
    }

    setSessoes((atuais) => [
      {
        id: data.id,
        materia,
        tempo_minutos: minutos,
        registrado_em: new Date().toISOString(),
      },
      ...atuais,
    ])
    toast.success(`${minutos} min registrados em ${materia}`)
    setSalvando(false)
    setModalSalvarAberto(false)
    zerar()
  }

  async function removerSessao(id: string) {
    setSessoes((atuais) => atuais.filter((x) => x.id !== id))
    const { error } = await supabase.from("study_sessions").delete().eq("id", id)
    if (error) {
      console.error("Erro ao remover sessão:", error)
      toast.error("Não foi possível remover a sessão")
    }
  }

  const horas = Math.floor(decorrido / 3600)
  const minutos = Math.floor((decorrido % 3600) / 60)
  const segundos = decorrido % 60

  const totalMinutos = sessoes.reduce((acc, s) => acc + s.tempo_minutos, 0)

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Cronômetro"
        subtitle="Marque o tempo de cada sessão para saber onde ele está indo."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Cronômetro ────────────────────────────────────── */}
        <Panel className="lg:col-span-2">
          <div className="flex flex-col items-center py-6">
            <Badge tone={rodando ? "accent" : "neutral"} dot={rodando}>
              {rodando ? "Contando" : decorrido > 0 ? "Pausado" : "Pronto"}
            </Badge>

            {/* Numerais tabulares: sem eles cada dígito tem largura própria
                e o mostrador treme a cada segundo. */}
            <time
              className={cn(
                "mt-5 font-mono text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl",
                rodando ? "text-fg" : "text-fg-muted"
              )}
              aria-live="off"
            >
              {String(horas).padStart(2, "0")}:{String(minutos).padStart(2, "0")}:
              {String(segundos).padStart(2, "0")}
            </time>
            <span className="sr-only" aria-live="polite">
              {rodando ? "Cronômetro em andamento" : "Cronômetro parado"}
            </span>

            <div className="mt-7 flex items-center gap-2">
              <Button variant={rodando ? "secondary" : "accent"} size="lg" onClick={alternar}>
                {rodando ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} />}
                {rodando ? "Pausar" : decorrido > 0 ? "Retomar" : "Iniciar"}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                disabled={decorrido === 0}
                onClick={() => setModalSalvarAberto(true)}
              >
                Salvar sessão
              </Button>

              <IconButton
                label="Zerar cronômetro"
                variant="ghost"
                size="lg"
                disabled={decorrido === 0}
                onClick={() => setConfirmarReset(true)}
              >
                <RotateCcw size={16} strokeWidth={2} />
              </IconButton>
            </div>
          </div>
        </Panel>

        {/* ── Resumo do dia ─────────────────────────────────── */}
        <Panel className="space-y-5">
          <div>
            <Stat
              label="Tempo hoje"
              value={`${Math.floor(totalMinutos / 60)}h ${totalMinutos % 60}min`}
              hint={`meta de ${META_DIARIA_MIN / 60}h`}
            />
            <Progress
              value={totalMinutos}
              max={META_DIARIA_MIN}
              className="mt-3"
              label={`${totalMinutos} de ${META_DIARIA_MIN} minutos da meta diária`}
            />
          </div>
          <div className="border-t border-line pt-4">
            <Stat label="Sessões" value={sessoes.length} hint="registradas hoje" />
          </div>
        </Panel>
      </div>

      {/* ── Sessões ─────────────────────────────────────────── */}
      <Panel flush>
        <PanelHeader
          title="Sessões de hoje"
          description={totalMinutos > 0 ? `${totalMinutos} minutos no total` : undefined}
        />

        {carregando ? (
          <ul>
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="border-b border-line px-4 py-3 last:border-0">
                <div className="skeleton h-3.5 w-1/3" />
                <div className="skeleton mt-2 h-3 w-16" />
              </li>
            ))}
          </ul>
        ) : sessoes.length === 0 ? (
          <EmptyState
            icon={<Timer size={16} strokeWidth={1.75} />}
            title="Nenhuma sessão registrada"
            description="Inicie o cronômetro e salve ao terminar — as sessões aparecem aqui."
          />
        ) : (
          <ul>
            {sessoes.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors duration-fast last:border-0 hover:bg-surface-hover"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{s.materia}</p>
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    {new Date(s.registrado_em).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-sm tabular-nums text-fg-muted">
                  {Math.floor(s.tempo_minutos / 60) > 0 && `${Math.floor(s.tempo_minutos / 60)}h `}
                  {s.tempo_minutos % 60}min
                </span>
                <IconButton
                  label={`Remover sessão de ${s.materia}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => removerSessao(s.id)}
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ── Salvar ──────────────────────────────────────────── */}
      <Modal
        open={modalSalvarAberto}
        onClose={() => setModalSalvarAberto(false)}
        title="Salvar sessão"
        description={`${Math.floor(decorrido / 60)} minutos cronometrados. Em qual matéria?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalSalvarAberto(false)}>
              Cancelar
            </Button>
            <Button variant="accent" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-1.5 py-1">
          {MATERIAS.map((m) => (
            <button
              key={m}
              onClick={() => setMateria(m)}
              className={cn(
                "rounded-md border px-2.5 py-2 text-left text-sm transition-colors duration-fast",
                materia === m
                  ? "border-line-accent bg-accent-soft text-fg"
                  : "border-line text-fg-muted hover:bg-surface-hover hover:text-fg"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={confirmarReset}
        onClose={() => setConfirmarReset(false)}
        title="Zerar o cronômetro?"
        description={`Os ${Math.floor(decorrido / 60)} minutos desta sessão serão descartados.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmarReset(false)}>
              Manter
            </Button>
            <Button variant="danger" onClick={zerar}>
              Zerar
            </Button>
          </>
        }
      />
    </div>
  )
}
