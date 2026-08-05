"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { formatarValor } from "@/lib/pagamentos-config"
import { Button, Panel } from "@/components/ui"
import { SITE_NAME } from "@/lib/constants"

/**
 * Página de assinatura.
 *
 * Página única de vendas, fora do shell do painel (sem sidebar nem barra
 * superior). Título, preço, benefícios e avisos vêm da config
 * `config_pagamentos` (editável no painel admin), via
 * /api/pagamentos/config — não há mais valores fixos em código.
 */

interface ConfigData {
  tituloPlano: string
  descricaoPlano: string
  valorCentavos: number
  beneficios: string[]
  limiteQuestoesDemo: number
  pagamentosAtivos: boolean
}

export default function AssinarPage() {
  const router = useRouter()
  const [plano, setPlano] = useState<string | null>(null)
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [pagando, setPagando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  const resultadoParam =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("resultado") : null

  useEffect(() => {
    setResultado(resultadoParam)
  }, [resultadoParam])

  useEffect(() => {
    let active = true
    fetch("/api/pagamentos/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) setConfig(data)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const carregarPerfil = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("plano")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single()
    setPlano(data?.plano ?? "demo")
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregarPerfil()
  }, [carregarPerfil])

  // Volta do Mercado Pago: o webhook pode levar alguns segundos para
  // processar — faz um polling curto quando o resultado foi success.
  useEffect(() => {
    if (resultado !== "success") return
    let tentativas = 0
    const timer = setInterval(async () => {
      tentativas += 1
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single()
      if (data?.plano === "vitalicio") {
        clearInterval(timer)
        setPlano("vitalicio")
      } else if (tentativas >= 10) {
        clearInterval(timer)
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [resultado])

  async function pagar() {
    setPagando(true)
    try {
      const res = await fetch("/api/pagamentos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Não foi possível iniciar o pagamento")
        setPagando(false)
        return
      }
      if (data.initPoint) {
        window.location.href = data.initPoint
        return
      }
      setPagando(false)
    } catch {
      toast.error("Falha de conexão ao iniciar o pagamento")
      setPagando(false)
    }
  }

  const titulo = config?.tituloPlano ?? "Plano vitalício"
  const descricao = config?.descricaoPlano ?? "Um pagamento. Acesso completo para sempre."
  const valorCentavos = config?.valorCentavos ?? 4999
  const beneficios = config?.beneficios ?? []
  const limiteQuestoesDemo = config?.limiteQuestoesDemo ?? 10
  const pagamentosAtivos = config?.pagamentosAtivos ?? true

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-4 py-8 lg:px-8">
      {/* ── Marca ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md transition-opacity duration-fast hover:opacity-80"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-xs font-bold text-fg-on-accent"
          >
            M
          </span>
          <span className="text-base font-semibold tracking-tight text-fg">{SITE_NAME}</span>
        </Link>

        <Link
          href="/dashboard"
          className="text-sm font-medium text-fg-muted transition-colors duration-fast hover:text-fg"
        >
          Voltar ao painel
        </Link>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center py-10">
        {carregando ? (
          <div className="h-6 w-48 animate-pulse rounded-md bg-surface-sunken" />
        ) : (
          <div className="w-full max-w-lg animate-rise space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-fg">{titulo}</h1>
              <p className="mt-2 text-base text-fg-muted">{descricao}</p>
            </div>

            {resultado === "success" && (
              <div className="rounded-lg border border-line-accent bg-accent-soft px-4 py-3 text-sm text-fg">
                Pagamento aprovado! Liberando seu acesso vitalício…
              </div>
            )}
            {resultado === "pending" && (
              <div className="rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                Pagamento em análise. Assim que for aprovado, seu acesso é liberado automaticamente.
              </div>
            )}
            {resultado === "failure" && (
              <div className="rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                O pagamento não foi concluído. Você pode tentar de novo quando quiser.
              </div>
            )}

            {plano === "vitalicio" ? (
              <Panel className="space-y-4 text-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <p className="font-semibold text-fg">Plano vitalício ativo</p>
                    <p className="text-sm text-fg-muted">Você tem acesso a tudo, para sempre.</p>
                  </div>
                </div>
                <Button variant="accent" block onClick={() => router.push("/dashboard")}>
                  Voltar ao dashboard
                </Button>
              </Panel>
            ) : (
              <>
                <Panel className="space-y-5 p-6 text-center">
                  <div>
                    <p className="text-sm font-medium text-fg-muted">pagamento único · para sempre</p>
                    <div className="mt-1 flex items-baseline justify-center gap-1">
                      <span className="font-mono text-5xl font-bold tracking-tight text-fg">
                        {formatarValor(valorCentavos)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-fg-faint">sem mensalidade · sem taxas escondidas</p>
                  </div>

                  <ul className="mx-auto max-w-sm space-y-2.5 text-left">
                    {beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-fg-muted">
                        <span className="mt-0.5 text-accent">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {!pagamentosAtivos ? (
                    <div className="rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                      Os pagamentos estão temporariamente desativados. Tente novamente mais tarde.
                    </div>
                  ) : (
                    <>
                      <Button variant="accent" block onClick={pagar} loading={pagando}>
                        {pagando ? "Abrindo Mercado Pago…" : "PAGAR COM MERCADO PAGO →"}
                      </Button>
                      <p className="text-center text-xs text-fg-faint">
                        PIX · cartão de crédito · boleto · garantia de 7 dias
                      </p>
                    </>
                  )}
                </Panel>

                <Panel className="space-y-3 p-5">
                  <p className="text-sm font-semibold text-fg">O que você desbloqueia agora</p>
                  <ul className="space-y-2 text-sm text-fg-muted">
                    <li className="flex items-start gap-2">
                      <span className="text-accent">✓</span>
                      {limiteQuestoesDemo} questões por dia passam a ser ilimitadas
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">✓</span>
                      Materiais em PDF completos
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">✓</span>
                      Ranking nacional de simulados
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent">✓</span>
                      Plano de estudos com IA
                    </li>
                  </ul>
                </Panel>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
