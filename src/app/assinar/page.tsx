"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Lock,
  Check,
  Sparkles,
  FileText,
  ListChecks,
  Trophy,
  BrainCircuit,
  BadgeCheck,
  CreditCard,
  ShieldCheck,
  Clock,
  Inbox,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatarValor } from "@/lib/pagamentos-config"
import { Button } from "@/components/ui"
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
  pagamentosAtivos: boolean
}

const RECURSOS_GRATIS: string[] = []

const FUNCIONALIDADES = [
  { icon: ListChecks, titulo: "Questões comentadas", desc: "Banco de questões comentadas, sem limite de respostas." },
  { icon: Trophy, titulo: "Simulados com ranking", desc: "Simulados cronometrados e ranking nacional de desempenho." },
  { icon: FileText, titulo: "Materiais em PDF", desc: "PDFs completos e atualizados das principais áreas." },
  { icon: BrainCircuit, titulo: "Plano de estudos com IA", desc: "Trilha personalizada que se ajusta ao seu desempenho." },
  { icon: Clock, titulo: "Cronômetro", desc: "Controle o tempo de estudo e mantenha sua constância." },
  { icon: BadgeCheck, titulo: "Métricas e estatísticas", desc: "Acompanhe sua evolução por matéria e por banca." },
]

const GARANTIAS = [
  { icon: ShieldCheck, titulo: "7 dias de garantia", desc: "Sem risco: reembolso total se não gostar na primeira semana." },
  { icon: CreditCard, titulo: "Pagamento único", desc: "Sem mensalidade, sem taxas escondidas. Você paga uma vez." },
  { icon: Inbox, titulo: "Acesso liberado na hora", desc: "Assim que o pagamento aprovar, tudo é liberado automaticamente." },
]

const FAQ = [
  {
    q: "Por quanto tempo tenho acesso?",
    a: "Para sempre. Você paga uma vez e usa o plano vitalício, com todas as 4 áreas (Concursos, OAB, Militar e ENEM) liberadas.",
  },
  {
    q: "Quais formas de pagamento aceito?",
    a: "PIX, cartão de crédito e boleto, pelo Mercado Pago. A liberação é automática após a aprovação.",
  },
  {
    q: "E se eu não gostar?",
    a: "Você tem 7 dias de garantia incondicional. Se não fizer sentido para você, devolvemos seu dinheiro.",
  },
]

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
  const pagamentosAtivos = config?.pagamentosAtivos ?? true

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-canvas text-fg">
      {/* ── Fundo decorativo ─────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 matrix-grid-lime opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-accent-soft blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 lg:px-8">
        {/* ── Marca ─────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md transition-opacity duration-fast hover:opacity-80"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm font-bold text-fg-on-accent"
            >
              M
            </span>
            <span className="text-base font-semibold tracking-tight text-fg">{SITE_NAME}</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-fg-muted transition-colors duration-fast hover:text-fg"
          >
            Voltar ao painel →
          </Link>
        </header>

        <main className="flex flex-1 flex-col items-center py-12 lg:py-16">
          {carregando ? (
            <div className="h-6 w-48 animate-pulse rounded-md bg-surface-sunken" />
          ) : plano === "vitalicio" ? (
            /* ── Já é vitalício ─────────────────────────────────── */
            <div className="max-w-md animate-rise space-y-5 text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
                <BadgeCheck size={32} strokeWidth={2} />
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-fg">Plano vitalício ativo</h1>
              <p className="text-base text-fg-muted">
                Você tem acesso a tudo, para sempre. Boa sorte nos estudos!
              </p>
              <Button variant="accent" size="lg" block onClick={() => router.push("/dashboard")}>
                Ir para o painel
              </Button>
            </div>
          ) : (
            <>
              {/* ── Resultado do pagamento ───────────────────────── */}
              {resultado === "success" && (
                <div className="mb-6 w-full max-w-lg rounded-lg border border-line-accent bg-accent-soft px-4 py-3 text-sm text-fg">
                  Pagamento aprovado! Liberando seu acesso vitalício…
                </div>
              )}
              {resultado === "pending" && (
                <div className="mb-6 w-full max-w-lg rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                  Pagamento em análise. Assim que for aprovado, seu acesso é liberado automaticamente.
                </div>
              )}
              {resultado === "failure" && (
                <div className="mb-6 w-full max-w-lg rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                  O pagamento não foi concluído. Você pode tentar de novo quando quiser.
                </div>
              )}

              {/* ── Hero ─────────────────────────────────────────── */}
              <div className="mx-auto max-w-2xl animate-rise text-center">
                <span className="label-tag bg-accent text-fg-on-accent">
                  <Sparkles size={12} /> acesso vitalício
                </span>
                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-fg lg:text-5xl">
                  Um pagamento para <span className="highlight-lime">aprovar de vez</span>.
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-fg-muted">{descricao}</p>
              </div>

              {/* ── Plano ────────────────────────────────────────── */}
              <div className="mt-12 grid w-full gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
                {/* Comparativo */}
                <div className="order-2 mx-auto w-full max-w-md animate-rise space-y-6 lg:order-1">
                  <PanelComparativo gratis={RECURSOS_GRATIS} vip={beneficios} />

                  {/* Garantias */}
                  <div className="space-y-4">
                    {GARANTIAS.map((g) => (
                      <div key={g.titulo} className="flex items-start gap-3">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                          <g.icon size={18} strokeWidth={2} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-fg">{g.titulo}</p>
                          <p className="text-sm text-fg-muted">{g.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card de compra */}
                <div className="order-1 mx-auto w-full max-w-md animate-rise lg:order-2 lg:sticky lg:top-8">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-accent bg-surface p-6 shadow-lg lg:p-8">
                    <span className="absolute right-0 top-0 rounded-bl-lg bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-fg-on-accent">
                      Melhor escolha
                    </span>

                    <p className="text-sm font-medium text-fg-muted">{titulo}</p>

                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-mono text-5xl font-bold tracking-tight text-fg">
                        {formatarValor(valorCentavos)}
                      </span>
                      <span className="text-sm text-fg-muted">pagamento único</span>
                    </div>
                    <p className="mt-1 text-xs text-fg-faint">sem mensalidade · sem taxas escondidas</p>

                    {!pagamentosAtivos ? (
                      <div className="mt-6 rounded-lg border border-line-strong bg-surface-hover px-4 py-3 text-sm text-fg-muted">
                        Os pagamentos estão temporariamente desativados. Tente novamente mais tarde.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={pagar}
                        disabled={pagando}
                        className="cta-primary mt-6 w-full rounded-xl bg-accent px-5 py-4 text-base font-semibold text-fg-on-accent"
                      >
                        {pagando ? "Abrindo Mercado Pago…" : "PAGAR COM MERCADO PAGO →"}
                      </button>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-fg-faint">
                      <Lock size={12} strokeWidth={2} />
                      <span>PIX · cartão de crédito · boleto · transação segura</span>
                    </div>

                    <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                      {beneficios.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-fg">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                            <Check size={13} strokeWidth={2.5} />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* ── Funcionalidades ──────────────────────────────── */}
              <section className="mt-20 w-full animate-rise">
                <h2 className="text-center text-2xl font-bold tracking-tight text-fg">
                  Tudo o que você desbloqueia ao assinar
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-center text-fg-muted">
                  O plano demo mostra o que te espera — com o vitalício você tem acesso real e completo.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {FUNCIONALIDADES.map((f) => (
                    <div
                      key={f.titulo}
                      className="feature-tile rounded-xl border border-line bg-surface p-5"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent">
                        <f.icon size={20} strokeWidth={2} />
                      </span>
                      <h3 className="mt-3 text-sm font-semibold text-fg">{f.titulo}</h3>
                      <p className="mt-1 text-sm text-fg-muted">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── FAQ ──────────────────────────────────────────── */}
              <section className="mx-auto mt-20 w-full max-w-2xl animate-rise">
                <h2 className="text-center text-2xl font-bold tracking-tight text-fg">Perguntas frequentes</h2>
                <div className="mt-8 space-y-3">
                  {FAQ.map((f) => (
                    <details key={f.q} className="feature-tile rounded-xl border border-line bg-surface p-5">
                      <summary className="flex items-center justify-between gap-4 text-sm font-semibold text-fg">
                        {f.q}
                        <span aria-hidden className="faq-toggle">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-sm text-fg-muted">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>

              {/* ── CTA final ────────────────────────────────────── */}
              <section className="mx-auto mt-20 w-full max-w-xl animate-rise">
                <div className="matrix-grid-lime rounded-2xl border border-line bg-surface p-8 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-fg">Pronto para começar?</h2>
                  <p className="mt-2 text-fg-muted">
                    Você paga {formatarValor(valorCentavos)} uma única vez e desbloqueia tudo, para sempre.
                  </p>
                  {pagamentosAtivos && (
                    <button
                      type="button"
                      onClick={pagar}
                      disabled={pagando}
                      className="cta-primary mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-fg-on-accent"
                    >
                      {pagando ? "Abrindo…" : "Assinar agora"}
                      {!pagando && <ArrowRight size={18} />}
                    </button>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <footer className="pb-4 text-center text-xs text-fg-faint">
          © {new Date().getFullYear()} {SITE_NAME.toLowerCase().replace(/\s+/g, "")}.com.br · Acesso vitalício · Pagamento único
        </footer>
      </div>
    </div>
  )
}

/** Comparativo demo × vitalício, sempre atualizado a partir da config. */
function PanelComparativo({ gratis, vip }: { gratis: string[]; vip: string[] }) {
  const Row = ({ titulo, sim }: { titulo: string; sim: boolean }) => (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-fg-muted">{titulo}</span>
      {sim ? (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent-soft text-accent">
          <Check size={13} strokeWidth={2.5} />
        </span>
      ) : (
        <span className="grid h-5 w-5 place-items-center rounded-full bg-negative-soft text-negative">
          <Lock size={12} strokeWidth={2} />
        </span>
      )}
    </div>
  )

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <p className="text-sm font-semibold text-fg">Demo × Vitalício</p>
          <p className="text-xs text-fg-muted">Compare o que muda</p>
        </div>
      </div>

      <div className="mt-2">
        {gratis.map((g) => (
          <Row key={g} titulo={g} sim />
        ))}
        {vip.map((v) => (
          <Row key={v} titulo={v} sim={false} />
        ))}
        {vip.length === 0 && (
          <p className="py-2 text-sm text-fg-muted">Sem acesso no plano demo. Assine para desbloquear.</p>
        )}
      </div>
    </div>
  )
}
