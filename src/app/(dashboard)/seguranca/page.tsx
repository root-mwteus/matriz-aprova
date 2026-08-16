"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { parseSessionId } from "@/lib/supabase/session"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import { Badge, EmptyState, ErrorState, Panel, Skeleton } from "@/components/ui"

/**
 * Segurança da conta: histórico de acessos (dispositivo, IP, horário)
 * e a regra de sessão única. O acesso marcado como "este dispositivo"
 * é o cujo session_id bate com o da sessão atual no navegador.
 */

interface LoginEvento {
  id: string
  navegador: string
  sistema: string
  ip: string | null
  session_id: string | null
  created_at: string
}

export default function SegurancaPage() {
  const supabase = createClient()
  const [eventos, setEventos] = useState<LoginEvento[]>([])
  const [sessionIdAtual, setSessionIdAtual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) setSessionIdAtual(parseSessionId(session.access_token))

        const res = await fetch("/api/seguranca/logins")
        if (!res.ok) throw new Error()
        const data = await res.json()
        setEventos(data.eventos ?? [])
      } catch {
        setErro("Não foi possível carregar o histórico de acessos")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  if (erro) return <ErrorState description={erro} onRetry={() => window.location.reload()} />

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Segurança"
        subtitle="Acessos recentes e o estado da sua sessão."
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-fg">Sessão única ativa</h3>
            <p className="mt-1 text-sm text-fg-subtle">
              A conta mantém apenas um acesso por vez — entrar em outro dispositivo
              desconecta este automaticamente.
            </p>
          </div>
          <Badge tone="positive">protegido</Badge>
        </div>
      </Panel>

      <Panel flush>
        <div className="flex items-baseline justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-fg">Acessos recentes</h3>
          <span className="text-xs text-fg-subtle">últimos 30</span>
        </div>

        {loading ? (
          <ul>
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="border-t border-line px-4 py-3">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="mt-2 h-2.5 w-56" />
              </li>
            ))}
          </ul>
        ) : eventos.length === 0 ? (
          <div className="border-t border-line">
            <EmptyState
              title="Nenhum acesso registrado"
              description="Os próximos logins aparecem aqui com dispositivo, IP e horário."
            />
          </div>
        ) : (
          <ul>
            {eventos.map((e) => {
              const atual = e.session_id != null && e.session_id === sessionIdAtual
              return (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-fg">
                      {e.navegador} <span className="text-fg-subtle">no</span> {e.sistema}
                      {atual && (
                        <span className="ml-2 text-xs font-medium text-accent-ink">
                          este dispositivo
                        </span>
                      )}
                    </p>
                    <p className={cn("mt-0.5 text-xs text-fg-subtle")}>
                      IP {e.ip ?? "não identificado"} · {formatarData(e.created_at)}
                    </p>
                  </div>
                  {atual && <Badge tone="accent" size="sm">atual</Badge>}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <p className="text-xs text-fg-faint">
        Não reconhece um acesso? Altere sua senha em recuperar senha — a sessão de quem
        entrou é desconectada no próximo acesso.
      </p>
    </div>
  )
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
