"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"
import { formatarValor } from "@/lib/pagamentos-config"

/**
 * Painel financeiro.
 *
 * Dois blocos:
 *   1. Configuração do plano — tudo que o checkout e o aviso de bloqueio
 *      exibem ao usuário, editável sem mexer em código.
 *   2. Pagamentos — receita aprovada/pendente e lista de cobranças.
 */

interface ConfigData {
  titulo_plano: string
  descricao_plano: string
  valor_centavos: number
  beneficios: string[]
  aviso_bloqueio: string
  pagamentos_ativos: boolean
}

interface PagamentoRow {
  id: string
  mp_payment_id: string | null
  status: string
  valor: number
  created_at: string
  aluno_nome: string | null
  aluno_email: string | null
}

interface ResumoFinanceiro {
  receitaAprovada: number
  receitaPendente: number
  aprovados: number
  pendentes: number
  rejeitados: number
  totalPagamentos: number
}

const STATUS_LABEL: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Rejeitado",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export default function AdminFinanceiroPage() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)

  const [tituloPlano, setTituloPlano] = useState("")
  const [descricaoPlano, setDescricaoPlano] = useState("")
  const [valorTexto, setValorTexto] = useState("")
  const [beneficios, setBeneficios] = useState<string[]>([])
  const [novoBeneficio, setNovoBeneficio] = useState("")
  const [avisoBloqueio, setAvisoBloqueio] = useState("")
  const [pagamentosAtivos, setPagamentosAtivos] = useState(true)

  const [pagamentos, setPagamentos] = useState<PagamentoRow[]>([])
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [filtroStatus, setFiltroStatus] = useState("todos")

  const carregarConfig = useCallback(async () => {
    const res = await fetch("/api/admin/pagamentos/config")
    const data = await res.json()
    if (res.status !== 200) {
      throw new Error(data.error)
    }
    const c: ConfigData = data.config
    setTituloPlano(c.titulo_plano)
    setDescricaoPlano(c.descricao_plano)
    setValorTexto((c.valor_centavos / 100).toFixed(2).replace(".", ","))
    setBeneficios(c.beneficios)
    setAvisoBloqueio(c.aviso_bloqueio)
    setPagamentosAtivos(c.pagamentos_ativos)
  }, [])

  const carregarPagamentos = useCallback(async () => {
    const res = await fetch(`/api/admin/pagamentos?status=${filtroStatus}`)
    const data = await res.json()
    if (res.status !== 200) {
      throw new Error(data.error)
    }
    setPagamentos(data.pagamentos)
    setResumo(data.resumo)
  }, [filtroStatus])

  useEffect(() => {
    let active = true
    Promise.all([carregarConfig(), carregarPagamentos()])
      .catch((e) => {
        console.error("financeiro: erro ao carregar", e)
        if (active) toast.error("Não foi possível carregar o painel financeiro")
      })
      .finally(() => {
        if (active) setCarregando(false)
      })
    return () => {
      active = false
    }
  }, [carregarConfig, carregarPagamentos])

  async function salvar() {
    if (!tituloPlano.trim() || !descricaoPlano.trim()) {
      toast.error("Preencha título e descrição do plano")
      return
    }
    if (!avisoBloqueio.trim()) {
      toast.error("Preencha o aviso de bloqueio")
      return
    }
    setSalvando(true)
    try {
      const res = await fetch("/api/admin/pagamentos/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tituloPlano,
          descricaoPlano,
          valorTexto,
          beneficios,
          avisoBloqueio,
          pagamentosAtivos,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Falha ao salvar")
        return
      }
      toast.success("Configuração salva. Já vale para novos pagamentos.")
    } catch {
      toast.error("Falha de conexão ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  function adicionarBeneficio() {
    const valor = novoBeneficio.trim()
    if (!valor) return
    setBeneficios((atuais) => [...atuais, valor])
    setNovoBeneficio("")
  }

  function removerBeneficio(indice: number) {
    setBeneficios((atuais) => atuais.filter((_, i) => i !== indice))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Financeiro</h1>
          <p className="text-xs text-muted mt-0.5">
            Configure o plano e acompanhe os pagamentos do Mercado Pago.
          </p>
        </div>
      </div>

      {carregando ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-card border border-card-border" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Receita ─────────────────────────────────────────── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="/ RECEITA APROVADA"
              value={resumo ? formatarValor(resumo.receitaAprovada) : "—"}
              variacao={`${resumo?.aprovados ?? 0} pagamentos`}
            />
            <MetricCard
              label="/ RECEITA PENDENTE"
              value={resumo ? formatarValor(resumo.receitaPendente) : "—"}
              variacao={`${resumo?.pendentes ?? 0} em análise`}
            />
            <MetricCard
              label="/ TOTAL DE COBRANÇAS"
              value={resumo?.totalPagamentos ?? "—"}
              variacao={`${resumo?.rejeitados ?? 0} rejeitados/cancelados`}
            />
            <MetricCard
              label="/ CHECKOUT"
              value={pagamentosAtivos ? "ATIVO" : "DESATIVADO"}
              variacao={pagamentosAtivos ? "novas compras abertas" : "bloqueado no momento"}
              variacaoPositiva={pagamentosAtivos}
            />
          </div>

          {/* ── Configuração do plano ───────────────────────────── */}
          <div className="bg-card border border-card-border rounded-card p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Configuração do plano</h2>
              <p className="text-xs text-muted mt-0.5">
                O que aparece no checkout, na página /assinar e no aviso de bloqueio do demo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="titulo-plano">Título do plano</label>
                <input
                  id="titulo-plano"
                  value={tituloPlano}
                  onChange={(e) => setTituloPlano(e.target.value)}
                  className="field h-9"
                  placeholder="Plano Vitalício Matriz Aprovação"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="valor-plano">Preço (R$)</label>
                <input
                  id="valor-plano"
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value)}
                  className="field h-9"
                  placeholder="49,99"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="descricao-plano">Descrição</label>
              <input
                id="descricao-plano"
                value={descricaoPlano}
                onChange={(e) => setDescricaoPlano(e.target.value)}
                className="field h-9"
                placeholder="Um pagamento. Acesso completo para sempre."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground" htmlFor="aviso-bloqueio">
                Aviso exibido ao usuário sem pagamento
              </label>
              <textarea
                id="aviso-bloqueio"
                value={avisoBloqueio}
                onChange={(e) => setAvisoBloqueio(e.target.value)}
                className="field w-full"
                rows={2}
                placeholder="Você está no plano demo. Assine o plano vitalício para desbloquear o acesso completo."
              />
              <p className="text-[11px] text-muted">Aparece no banner do painel e nas telas bloqueadas.</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Benefícios anunciados no checkout</p>
              <ul className="space-y-1.5">
                {beneficios.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-[11px] text-accent bg-accent/10 px-2 py-1 rounded-md flex-1">{b}</span>
                    <button
                      type="button"
                      onClick={() => removerBeneficio(i)}
                      className="text-muted hover:text-red-400 transition-colors"
                      aria-label={`Remover benefício: ${b}`}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={novoBeneficio}
                  onChange={(e) => setNovoBeneficio(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      adicionarBeneficio()
                    }
                  }}
                  className="field h-9 flex-1"
                  placeholder="Novo benefício…"
                />
                <button
                  type="button"
                  onClick={adicionarBeneficio}
                  className="h-9 px-3 rounded-md border border-card-border bg-white/5 text-foreground hover:bg-white/10 transition-colors inline-flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-card-border pt-4">
              <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={pagamentosAtivos}
                  onChange={(e) => setPagamentosAtivos(e.target.checked)}
                  className="accent-[#CBFF4D] h-4 w-4"
                />
                Pagamentos ativos (novas compras liberadas)
              </label>
              <button
                onClick={salvar}
                disabled={salvando}
                className="h-9 px-4 rounded-lg bg-accent text-fg-on-accent text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {salvando ? "Salvando…" : "Salvar configuração"}
              </button>
            </div>
          </div>

          {/* ── Lista de pagamentos ─────────────────────────────── */}
          <div className="bg-card border border-card-border rounded-card overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="text-[11px] text-muted font-mono">/ PAGAMENTOS RECENTES</div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="field h-8 w-auto text-xs"
              >
                <option value="todos">Todos os status</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <AdminTable
              loading={carregando}
              columns={[
                {
                  key: "aluno",
                  header: "ALUNO",
                  render: (row) => (
                    <div>
                      <div className="text-sm text-foreground">{row.aluno_nome ?? "—"}</div>
                      <div className="text-[11px] text-muted">{row.aluno_email}</div>
                    </div>
                  ),
                },
                {
                  key: "valor",
                  header: "VALOR",
                  render: (row) => <span className="text-sm text-foreground font-mono">{formatarValor(row.valor)}</span>,
                },
                {
                  key: "status",
                  header: "STATUS",
                  render: (row) => (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        row.status === "approved"
                          ? "text-[#2EB872] bg-[#2EB872]/10"
                          : row.status === "pending"
                            ? "text-yellow-400 bg-yellow-400/10"
                            : row.status === "refunded"
                              ? "text-blue-400 bg-blue-400/10"
                              : "text-red-400 bg-red-400/10"
                      }`}
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  ),
                },
                {
                  key: "mp_payment_id",
                  header: "ID MP",
                  render: (row) => (
                    <span className="text-xs text-muted font-mono">{row.mp_payment_id ?? "—"}</span>
                  ),
                },
                {
                  key: "created_at",
                  header: "DATA",
                  render: (row) => <span className="text-xs text-muted font-mono">{row.created_at}</span>,
                },
              ]}
              data={pagamentos}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
