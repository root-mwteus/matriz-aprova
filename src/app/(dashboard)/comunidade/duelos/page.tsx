"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Swords, Timer, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import PerfilAvatar from "@/components/comunidade/PerfilAvatar"
import { Badge, Button, ErrorState, Panel, Skeleton } from "@/components/ui"

/**
 * Duelo 1v1 — fila rápida.
 *
 * Estados: ocioso → buscando (fila) → partida (5 questões) →
 * resultado. O pareamento chega pelo UPDATE do Realtime na linha do
 * duelo (filter por id); polling de 4s como plano B. O progresso do
 * oponente também vem do Realtime — cada resposta minha é um UPDATE
 * na linha, que ele recebe.
 */

const TEMPO_POR_QUESTAO = 45 // segundos

interface QuestaoDetalhe {
  id: string
  enunciado: string
  alternativas: { letter: string; text: string }[]
  banca?: string | null
  ano?: number | null
  materia?: string | null
  resposta_correta?: number
  explicacao?: string | null
}

interface JogadorResumo {
  nome: string
  icone_path?: string | null
  moldura_id?: string | null
}

interface DueloEstado {
  id: string
  status: "aguardando" | "ativo" | "finalizado" | "expirado" | "cancelado"
  questoes_detalhes?: QuestaoDetalhe[]
  respostas_a?: { questao_id: string }[]
  respostas_b?: { questao_id: string }[]
  jogador_a?: string
  jogador_b?: string | null
  vencedor?: string | null
  acertos_a?: number
  acertos_b?: number
  /** Aparência de quem está na partida — para mostrar o oponente. */
  jogadores?: Record<string, JogadorResumo>
}

type Fase = "ocioso" | "buscando" | "partida" | "resultado"

export default function DuelosPage() {
  const supabase = createClient()
  const [fase, setFase] = useState<Fase>("ocioso")
  const [duelo, setDuelo] = useState<DueloEstado | null>(null)
  const [meuId, setMeuId] = useState("")
  const [erro, setErro] = useState("")
  const [precisaPlano, setPrecisaPlano] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => user && setMeuId(user.id))
  }, [supabase])

  const buscar = async () => {
    setErro("")
    setPrecisaPlano(false)
    try {
      const res = await fetch("/api/duelos", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        if (data.precisaPlano) setPrecisaPlano(true)
        throw new Error(data.error ?? "Falha ao buscar oponente")
      }
      // Quem puxa o pareamento recebe a partida pronta na resposta —
      // vai direto pras questões, sem passar pela fase de espera.
      if (data.status === "ativo" && data.duelo) {
        setDuelo({ ...data.duelo, jogadores: data.jogadores })
        setFase("partida")
        return
      }
      setFase("buscando")
      setDuelo({ id: data.id, status: data.status })
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado")
    }
  }

  const cancelar = async () => {
    if (!duelo) return
    await fetch(`/api/duelos/${duelo.id}`, { method: "POST" }).catch(() => {})
    setFase("ocioso")
    setDuelo(null)
  }

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Duelos"
        subtitle="5 questões contra outro estudante, no tempo. Vitória vale 10 pontos na liga."
      />

      {erro && <ErrorState description={erro} onRetry={buscar} />}

      {precisaPlano && (
        <Panel>
          <p className="text-sm text-fg-subtle">
            Duelos estão disponíveis no plano vitalício.{" "}
            <a href="/assinar" className="font-medium text-accent-ink hover:underline">
              Ver plano vitalício
            </a>
          </p>
        </Panel>
      )}

      {fase === "ocioso" && !erro && !precisaPlano && (
        <Panel className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <Swords size={20} strokeWidth={2} />
          </span>
          <h3 className="mt-3 text-base font-semibold text-fg">Rápido e direto</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-fg-subtle">
            Você entra na fila e a plataforma encontra um oponente. Mesmo número de acertos
            vence quem respondeu mais rápido.
          </p>
          <Button variant="accent" size="lg" className="mt-4" onClick={buscar}>
            Buscar oponente
          </Button>
        </Panel>
      )}

      {fase === "buscando" && (
        <BuscandoOponente
          duelo={duelo}
          onAtivo={(d) => {
            setDuelo(d)
            setFase("partida")
          }}
          onCancelar={cancelar}
        />
      )}

      {fase === "partida" && duelo && (
        <Partida
          duelo={duelo}
          meuId={meuId}
          onFim={(d) => {
            setDuelo(d)
            setFase("resultado")
          }}
        />
      )}

      {fase === "resultado" && duelo && <Resultado duelo={duelo} meuId={meuId} onNovo={buscar} />}
    </div>
  )
}

/* ── Busca ─────────────────────────────────────────────────── */

function BuscandoOponente({
  duelo,
  onAtivo,
  onCancelar,
}: {
  duelo: DueloEstado | null
  onAtivo: (d: DueloEstado) => void
  onCancelar: () => void
}) {
  const [segundos, setSegundos] = useState(0)

  // Realtime: o UPDATE que grava jogador_b/status=ativo me acorda.
  useEffect(() => {
    if (!duelo?.id) return
    const id = duelo.id
    const supabase = createClient()
    const canal = supabase
      .channel(`duelo-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "duelos", filter: `id=eq.${id}` },
        (payload) => {
          const novo = payload.new as DueloEstado
          if (novo.status === "ativo") {
            carregar()
          }
        }
      )
      .subscribe()

    const poll = setInterval(carregar, 4000)
    const relogio = setInterval(() => setSegundos((s) => s + 1), 1000)

    async function carregar() {
      try {
        const res = await fetch(`/api/duelos/${id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.duelo.status === "ativo") {
          clearInterval(poll)
          clearInterval(relogio)
          onAtivo({ ...data.duelo, jogadores: data.jogadores })
        } else if (data.duelo.status !== "aguardando") {
          clearInterval(poll)
          clearInterval(relogio)
          onCancelar()
        }
      } catch {}
    }

    return () => {
      canal.unsubscribe()
      clearInterval(poll)
      clearInterval(relogio)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelo?.id])

  return (
    <Panel className="text-center">
      <Skeleton className="mx-auto h-12 w-12 rounded-full" />
      <h3 className="mt-3 text-base font-semibold text-fg">Procurando oponente…</h3>
      <p className="mt-1 text-sm text-fg-subtle">
        {segundos}s de busca · o pareamento é avisado aqui mesmo
      </p>
      <Button variant="secondary" className="mt-4" onClick={onCancelar}>
        Cancelar busca
      </Button>
    </Panel>
  )
}

/* ── Partida ───────────────────────────────────────────────── */

function Partida({
  duelo,
  meuId,
  onFim,
}: {
  duelo: DueloEstado
  meuId: string
  onFim: (d: DueloEstado) => void
}) {
  const supabase = createClient()
  const questoes = duelo.questoes_detalhes ?? []
  const souA = duelo.jogador_a === meuId
  const oponenteId = souA ? duelo.jogador_b : duelo.jogador_a
  const meuJogador = duelo.jogadores?.[meuId]
  const oponente = duelo.jogadores?.[oponenteId ?? ""]
  const [indice, setIndice] = useState(0)
  const [respondeu, setRespondeu] = useState(false)
  const [ultima, setUltima] = useState<{ correta: number; acertei: boolean } | null>(null)
  const [oponenteFeitas, setOponenteFeitas] = useState(
    (() => {
      const souA = duelo.jogador_a === meuId
      const minhas = souA ? duelo.respostas_b?.length : duelo.respostas_a?.length
      return minhas ?? 0
    })()
  )
  const inicioQuestao = useRef(Date.now())
  const [restante, setRestante] = useState(TEMPO_POR_QUESTAO)

  // Relógio da questão: 45s, auto-pula com -1.
  useEffect(() => {
    if (respondeu) return
    const t = setInterval(() => {
      const resta = TEMPO_POR_QUESTAO - Math.floor((Date.now() - inicioQuestao.current) / 1000)
      setRestante(Math.max(0, resta))
      if (resta <= 0) responder(-1)
    }, 250)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, respondeu])

  // Progresso do oponente em tempo real.
  useEffect(() => {
    const canal = supabase
      .channel(`duelo-${duelo.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "duelos", filter: `id=eq.${duelo.id}` },
        (payload) => {
          const novo = payload.new as DueloEstado
          const souA = duelo.jogador_a === meuId
          setOponenteFeitas((souA ? novo.respostas_b?.length : novo.respostas_a?.length) ?? 0)
          if (novo.status === "finalizado") {
            carregarFinal()
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(canal)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelo.id])

  const carregarFinal = useCallback(async () => {
    const res = await fetch(`/api/duelos/${duelo.id}`)
    if (res.ok) {
      const data = await res.json()
      if (data.duelo.status === "finalizado") onFim({ ...data.duelo, jogadores: data.jogadores })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelo.id])

  const responder = async (escolha: number) => {
    if (respondeu || !questoes[indice]) return
    setRespondeu(true)
    const tempo = Math.min(TEMPO_POR_QUESTAO, Math.ceil((Date.now() - inicioQuestao.current) / 1000))
    try {
      const res = await fetch(`/api/duelos/${duelo.id}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questao_id: questoes[indice].id,
          resposta: escolha,
          tempo_segundos: tempo,
        }),
      })
      const data = await res.json()
      setUltima({ correta: data.resposta_correta, acertei: data.correto })

      if (data.status === "finalizado") {
        const final = await fetch(`/api/duelos/${duelo.id}`)
        if (final.ok) {
          const f = await final.json()
          setTimeout(() => onFim({ ...f.duelo, jogadores: f.jogadores }), 1500)
        }
      }
    } catch {
      setRespondeu(false)
    }
  }

  const avancar = () => {
    setUltima(null)
    setRespondeu(false)
    setRestante(TEMPO_POR_QUESTAO)
    inicioQuestao.current = Date.now()
    setIndice((i) => i + 1)
  }

  if (!questoes[indice]) {
    // Respondi tudo; esperando o oponente ou o fechamento automático.
    return (
      <Panel className="text-center">
        <Timer size={20} className="mx-auto text-accent-ink" />
        <h3 className="mt-3 text-base font-semibold text-fg">Você terminou!</h3>
        <p className="mt-1 text-sm text-fg-subtle">
          {oponente?.nome ?? "Oponente"}: {oponenteFeitas}/{questoes.length} · o duelo fecha sozinho em
          até 10 min.
        </p>
        <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full bg-accent transition-all duration-fast"
            style={{ width: `${(oponenteFeitas / questoes.length) * 100}%` }}
          />
        </div>
      </Panel>
    )
  }

  const q = questoes[indice]

  return (
    <div className="space-y-4">
      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-line pb-3">
          <span className="flex min-w-0 items-center gap-2 text-xs text-fg-subtle">
            <PerfilAvatar
              nome={meuJogador?.nome}
              iconePath={meuJogador?.icone_path}
              molduraId={meuJogador?.moldura_id}
              size={22}
            />
            <span className="truncate">{meuJogador?.nome ?? "Você"}</span>
          </span>
          <span className="flex min-w-0 items-center gap-2 text-xs text-fg-subtle">
            <span className="truncate">{oponente?.nome ?? "Oponente"}</span>
            <PerfilAvatar
              nome={oponente?.nome}
              iconePath={oponente?.icone_path}
              molduraId={oponente?.moldura_id}
              size={22}
            />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Badge tone={restante <= 10 ? "caution" : "accent"}>
            Questão {indice + 1} de {questoes.length}
          </Badge>
          <span className="flex items-center gap-1.5 text-sm tabular-nums text-fg-subtle">
            <Timer size={14} strokeWidth={2} />
            {restante}s
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn("h-full transition-all duration-fast", restante <= 10 ? "bg-caution" : "bg-accent")}
              style={{ width: `${(restante / TEMPO_POR_QUESTAO) * 100}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs text-fg-faint">
            op.: {oponenteFeitas}/{questoes.length}
          </span>
        </div>

        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-fg">{q.enunciado}</p>

        <div className="mt-4 space-y-2">
          {q.alternativas?.map((alt, i) => {
            const eACorreta = ultima != null && ultima.correta === i
            return (
              <button
                key={i}
                type="button"
                disabled={respondeu}
                onClick={() => responder(i)}
                className={cn(
                  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-fg transition-colors duration-fast",
                  !respondeu && "hover:border-accent-ink hover:bg-surface-hover",
                  eACorreta && "border-positive bg-positive-soft"
                )}
              >
                <span className="mr-2 font-semibold text-fg-subtle">{alt.letter}</span>
                {alt.text}
              </button>
            )
          })}
        </div>

        {ultima && (
          <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
            <span className={cn("text-sm font-medium", ultima.acertei ? "text-positive" : "text-negative")}>
              {ultima.acertei ? "Acertou!" : `Errou — gabarito: ${letra(ultima.correta)}`}
            </span>
            {indice + 1 < questoes.length && (
              <Button variant="accent" size="sm" onClick={avancar}>
                Próxima
              </Button>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}

/* ── Resultado ─────────────────────────────────────────────── */

function Resultado({
  duelo,
  meuId,
  onNovo,
}: {
  duelo: DueloEstado
  meuId: string
  onNovo: () => void
}) {
  const souA = duelo.jogador_a === meuId
  const meus = (souA ? duelo.acertos_a : duelo.acertos_b) ?? 0
  const dele = (souA ? duelo.acertos_b : duelo.acertos_a) ?? 0
  const venci = duelo.vencedor === meuId
  const empate = duelo.vencedor == null
  const oponenteId = souA ? duelo.jogador_b : duelo.jogador_a
  const meuJogador = duelo.jogadores?.[meuId]
  const oponente = duelo.jogadores?.[oponenteId ?? ""]

  return (
    <Panel className="text-center">
      <span
        className={cn(
          "mx-auto grid h-12 w-12 place-items-center rounded-full",
          venci ? "bg-accent-soft text-accent-ink" : "bg-surface-sunken text-fg-subtle"
        )}
      >
        <Trophy size={20} strokeWidth={2} />
      </span>
      <h3 className="mt-3 text-lg font-semibold text-fg">
        {empate ? "Empate!" : venci ? "Vitória!" : "Derrota"}
      </h3>

      <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <PerfilAvatar
            nome={meuJogador?.nome}
            iconePath={meuJogador?.icone_path}
            molduraId={meuJogador?.moldura_id}
            size={48}
          />
          <span className="w-full truncate text-xs font-medium text-fg">
            {meuJogador?.nome ?? "Você"}
          </span>
        </div>
        <span className="shrink-0 text-2xl font-semibold tabular-nums text-fg">
          {meus} <span className="text-fg-subtle">×</span> {dele}
        </span>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <PerfilAvatar
            nome={oponente?.nome}
            iconePath={oponente?.icone_path}
            molduraId={oponente?.moldura_id}
            size={48}
          />
          <span className="w-full truncate text-xs font-medium text-fg">
            {oponente?.nome ?? "Oponente"}
          </span>
        </div>
      </div>

      <p className="mt-3 text-sm text-fg-subtle">
        {empate ? "+5 pontos na liga para os dois" : venci ? "+10 pontos na liga" : "+2 pontos na liga"}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <Button variant="accent" onClick={onNovo}>
          Novo duelo
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = "/comunidade/ligas")}>
          Ver liga
        </Button>
      </div>
    </Panel>
  )
}

function letra(indice: number) {
  return ["A", "B", "C", "D", "E"][indice] ?? "?"
}
