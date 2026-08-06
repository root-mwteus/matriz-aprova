"use client"

import { useEffect, useState } from "react"
import { Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, EmptyState, Panel, Skeleton } from "@/components/ui"

/**
 * Ranking de questões resolvidas e acertos.
 *
 * Global (sem `grupoId`) ou restrito aos membros de um grupo (com
 * `grupoId`). A agregação acontece no banco — a rota /api devolve o
 * resumo pronto. Ordenado por acertos, depois por questões resolvidas.
 */

export interface RankingEntry {
  user_id: string
  nome: string
  questoes: number
  acertos: number
  pct: number
}

export default function Ranking({ grupoId, className }: { grupoId?: string; className?: string }) {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [meuId, setMeuId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setCarregando(true)
    setErro(null)

    const url = grupoId
      ? `/api/comunidade/grupos/${encodeURIComponent(grupoId)}/ranking`
      : "/api/comunidade/ranking"

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao carregar ranking")
        return res.json()
      })
      .then((data) => {
        if (!active) return
        setRanking(data.ranking ?? [])
        setMeuId(data.meu_id ?? null)
      })
      .catch(() => {
        if (active) setErro("Não foi possível carregar o ranking")
      })
      .finally(() => {
        if (active) setCarregando(false)
      })

    return () => {
      active = false
    }
  }, [grupoId])

  const minhaPosicao = ranking.findIndex((e) => e.user_id === meuId) + 1

  return (
    <Panel flush className={className}>
      {carregando ? (
        <ul className="divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-3 w-10" />
            </li>
          ))}
        </ul>
      ) : erro ? (
        <EmptyState
          icon={<Trophy size={16} strokeWidth={1.75} />}
          title="Erro"
          description={erro}
          className="py-10"
        />
      ) : ranking.length === 0 ? (
        <EmptyState
          icon={<Trophy size={16} strokeWidth={1.75} />}
          title="Ranking vazio"
          description={
            grupoId
              ? "Resolva questões para aparecer no ranking do grupo."
              : "Nenhuma questão respondida ainda. Seja o primeiro a entrar no ranking."
          }
          className="py-10"
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {ranking.map((entry, i) => {
              const euMesmo = entry.user_id === meuId
              const podio = i < 3
              return (
                <li
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
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

                  <Avatar name={entry.nome} size={28} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">
                      {entry.nome}
                      {euMesmo && <span className="ml-1.5 text-xs text-fg-subtle">(você)</span>}
                    </p>
                    <p className="text-xs tabular-nums text-fg-subtle">
                      {entry.questoes} {entry.questoes === 1 ? "questão" : "questões"} ·{" "}
                      <span className="text-positive">{entry.acertos} acertos</span>
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
          <p className="border-t border-line px-4 py-2.5 text-2xs text-fg-subtle">
            {minhaPosicao > 0
              ? `Sua posição: ${minhaPosicao}º de ${ranking.length}.`
              : "Você ainda não aparece — resolva questões e entre no ranking."}
          </p>
        </>
      )}
    </Panel>
  )
}
