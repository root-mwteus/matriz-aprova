"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import PerfilAvatar from "@/components/comunidade/PerfilAvatar"
import { Badge, Button, EmptyState, Panel, PanelHeader, Skeleton } from "@/components/ui"

/**
 * Ranking.
 *
 * O ranking não pode ser lido com a chave anônima: o RLS de `simulations`
 * só expõe as linhas do próprio usuário. A página busca a lista pronta em
 * /api/simulados/ranking, que usa service_role no servidor e devolve os
 * melhores resultados de todos, já ordenados.
 *
 * O pódio deixou de usar ouro/prata/bronze como única distinção: as três
 * primeiras posições ganham peso tipográfico, e a cor virou reforço.
 */

interface RankingEntry {
  user_id: string
  nome: string
  icone_path: string | null
  moldura_id: string | null
  pontuacao: number
  total: number
  tempo_total: number
  pct: number
  created_at: string
}

export default function RankingPage() {
  const router = useRouter()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/simulados/ranking", { cache: "no-store" })
        if (res.status !== 200) {
          router.push("/login")
          return
        }
        const data = await res.json()
        setRanking(data.ranking ?? [])
        setUserId(data.userId ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const minhaPosicao = ranking.findIndex((e) => e.user_id === userId) + 1

  return (
    <div className="mx-auto max-w-[640px] animate-rise space-y-5">
      <PageHeader
        title="Ranking"
        subtitle="Melhor resultado de cada participante nos últimos simulados."
        actions={
          <Button variant="secondary" onClick={() => router.push("/simulados")}>
            Fazer simulado
          </Button>
        }
      />

      <Panel className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-fg-subtle">Sua posição</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-fg">
            {minhaPosicao}º
            <span className="ml-1.5 text-base font-normal text-fg-faint">
              de {ranking.length}
            </span>
          </p>
        </div>
        {minhaPosicao === 1 && (
          <Badge tone="accent" className="shrink-0">
            <Trophy size={11} strokeWidth={2} />
            Primeiro lugar
          </Badge>
        )}
      </Panel>

      <Panel flush>
        <PanelHeader title="Melhores resultados" description="Ordenado por acerto e tempo" />

        {loading ? (
          <ul>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 flex-1" style={{ maxWidth: `${60 - i * 5}%` }} />
                <Skeleton className="h-3 w-10" />
              </li>
            ))}
          </ul>
        ) : ranking.length === 0 ? (
          <EmptyState
            icon={<Trophy size={16} strokeWidth={1.75} />}
            title="Nenhum resultado ainda"
            description="Faça o primeiro simulado e abra o ranking."
            action={
              <Button variant="accent" onClick={() => router.push("/simulados")}>
                Montar simulado
              </Button>
            }
          />
        ) : (
          <ul>
            {ranking.map((entry, i) => {
              const euMesmo = entry.user_id === userId
              const podio = i < 3

              return (
                <li
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 border-b border-line px-4 py-3 last:border-0",
                    euMesmo && "bg-accent-soft"
                  )}
                >
                  <span
                    className={cn(
                      "w-7 shrink-0 text-sm tabular-nums",
                      podio ? "font-semibold text-fg" : "text-fg-faint"
                    )}
                  >
                    {i + 1}º
                  </span>

                  <PerfilAvatar
                    nome={entry.nome}
                    iconePath={entry.icone_path}
                    molduraId={entry.moldura_id}
                    size={26}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">
                      {entry.nome}
                      {euMesmo && <span className="ml-1.5 text-xs text-fg-subtle">(você)</span>}
                    </p>
                    <p className="text-xs tabular-nums text-fg-subtle">
                      {entry.pontuacao}/{entry.total} acertos ·{" "}
                      {Math.floor(entry.tempo_total / 60)} min
                    </p>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 text-sm tabular-nums",
                      podio ? "font-semibold text-fg" : "text-fg-muted"
                    )}
                  >
                    {entry.pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
