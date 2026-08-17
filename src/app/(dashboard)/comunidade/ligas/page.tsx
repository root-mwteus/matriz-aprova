"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, Minus, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import PerfilAvatar from "@/components/comunidade/PerfilAvatar"
import { Badge, EmptyState, ErrorState, Panel, Skeleton } from "@/components/ui"

/**
 * Ligas semanais.
 *
 * O ranking de pontos da semana é fatiado em ligas de 50 na leitura:
 * top 5 da fatia sobe (promoção), bottom 5 desce (rebaixamento). Não
 * existe "cadastro" em liga — sua liga é a fatia onde seus pontos te
 * colocam agora; a semana vira sozinha (chave = segunda-feira).
 */

const TAMANHO_LIGA = 50
const ZONA = 5

interface Entrada {
  user_id: string
  nome: string
  icone_path: string | null
  moldura_id: string | null
  pontos: number
}

const NOMES_LIGA = ["Ouro", "Prata", "Bronze", "Ferro"]

export default function LigasPage() {
  const [ranking, setRanking] = useState<Entrada[]>([])
  const [meuId, setMeuId] = useState("")
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/comunidade/ligas")
        if (!res.ok) throw new Error()
        const data = await res.json()
        setRanking(data.ranking ?? [])
        setMeuId(data.meu_id ?? "")
      } catch {
        setErro("Não foi possível carregar as ligas")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /** Fatia onde eu estou + contexto (a liga inteira, cortada ao meu redar). */
  const minhaLiga = useMemo(() => {
    const idx = ranking.findIndex((e) => e.user_id === meuId)
    if (idx === -1) return { liga: 0, indice: -1, inicio: 0, entradas: ranking.slice(0, TAMANHO_LIGA) }
    const liga = Math.floor(idx / TAMANHO_LIGA)
    const inicio = liga * TAMANHO_LIGA
    return { liga, indice: idx, inicio, entradas: ranking.slice(inicio, inicio + TAMANHO_LIGA) }
  }, [ranking, meuId])

  if (erro) return <ErrorState description={erro} onRetry={() => window.location.reload()} />

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Ligas"
        subtitle={
          loading
            ? "Carregando a semana…"
            : `Semana de ${formatarSemana()} · pontos zeram toda segunda-feira`
        }
      />

      {loading ? (
        <Panel flush>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-line px-4 py-3 last:border-0">
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </Panel>
      ) : ranking.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Trophy size={16} strokeWidth={1.75} />}
            title="A semana começou agora"
            description="Responda questões, feche simulados e vença duelos para pontuar — o primeiro na liga leva o bronze."
          />
        </Panel>
      ) : (
        <Panel flush>
          <div className="flex items-baseline justify-between px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">
              Liga {NOMES_LIGA[Math.min(minhaLiga.liga, NOMES_LIGA.length - 1)]}
              {minhaLiga.indice === -1 && " · Topo"}
            </h3>
            <span className="text-xs text-fg-subtle">
              {minhaLiga.indice >= 0
                ? `${minhaLiga.indice + 1}º geral · fatia ${minhaLiga.liga + 1}`
                : "sem pontos nesta semana"}
            </span>
          </div>

          <ul>
            {minhaLiga.entradas.map((e, i) => {
              const posicaoGeral = minhaLiga.inicio + i + 1
              const eu = e.user_id === meuId
              const promo = i < ZONA
              const rebaixa = i >= minhaLiga.entradas.length - ZONA && minhaLiga.entradas.length === TAMANHO_LIGA
              return (
                <li
                  key={e.user_id}
                  className={cn(
                    "flex items-center gap-3 border-t border-line px-4 py-2.5",
                    eu && "bg-surface-hover"
                  )}
                >
                  <span className="w-8 shrink-0 text-right text-sm tabular-nums text-fg-subtle">
                    {posicaoGeral}º
                  </span>
                  <PerfilAvatar
                    nome={e.nome}
                    iconePath={e.icone_path}
                    molduraId={e.moldura_id}
                    size={26}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">
                    {e.nome}
                    {eu && <span className="ml-2 text-xs font-medium text-accent-ink">você</span>}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-fg-faint" title={promo ? "Zona de promoção" : rebaixa ? "Zona de rebaixamento" : undefined}>
                    {promo ? (
                      <ChevronUp size={13} strokeWidth={2.5} className="text-positive" />
                    ) : rebaixa ? (
                      <ChevronDown size={13} strokeWidth={2.5} className="text-negative" />
                    ) : (
                      <Minus size={13} strokeWidth={2.5} className="opacity-30" />
                    )}
                  </span>
                  <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-fg">
                    {e.pontos}
                    <span className="ml-1 text-xs font-normal text-fg-subtle">pts</span>
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-line px-4 py-3 text-xs text-fg-faint">
            <Badge tone="accent" size="sm">↑ top {ZONA} sobe</Badge>{" "}
            <Badge size="sm">↓ últimos {ZONA} descem</Badge>{" "}
            <span className="ml-1">· liga = fatia de {TAMANHO_LIGA} do ranking semanal</span>
          </div>
        </Panel>
      )}

      <Panel>
        <h3 className="text-sm font-semibold text-fg">Como pontuar</h3>
        <ul className="mt-2 space-y-1 text-sm text-fg-subtle">
          <li>Resposta registrada · 1 ponto</li>
          <li>Resposta certa · +2 pontos</li>
          <li>Simulado finalizado · +5 pontos</li>
          <li>Duelo vencido · +10 pontos · empate +5 · derrota +2</li>
        </ul>
      </Panel>
    </div>
  )
}

function formatarSemana() {
  const agora = new Date()
  const dia = agora.getUTCDay()
  const offset = dia === 0 ? -6 : 1 - dia
  const segunda = new Date(agora)
  segunda.setUTCDate(segunda.getUTCDate() + offset)
  return segunda.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" })
}
