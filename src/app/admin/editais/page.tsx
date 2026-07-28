"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { createClient } from "@/lib/supabase/client"
import type { Edital } from "@/types"

const areas = ["Concursos", "OAB", "Militar", "ENEM"]
const statusOptions: Edital["status"][] = ["aberto", "previsto", "encerrado"]

const STATUS_LABEL: Record<Edital["status"], string> = {
  aberto: "ABERTO",
  previsto: "PREVISTO",
  encerrado: "ENCERRADO",
}

const STATUS_STYLE: Record<Edital["status"], string> = {
  aberto: "text-green-400 bg-green-400/10 border border-green-400/30",
  previsto: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30",
  encerrado: "text-muted bg-card-border/50 border border-card-border",
}

type FormState = Omit<Edital, "id" | "created_at">

const FORM_VAZIO: FormState = {
  orgao: "",
  cargo: "",
  banca: "",
  area_concurso: areas[0],
  vagas: null,
  data_prova: null,
  data_inscricao_fim: null,
  link: "",
  status: "aberto",
}

export default function AdminEditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Edital | null>(null)
  const [criando, setCriando] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Edital | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("editais").select("*").order("data_prova", { ascending: true, nullsFirst: false })
    if (error) {
      console.error("Erro ao carregar editais:", error)
      toast.error("Erro ao carregar editais")
    } else {
      setEditais(data || [])
    }
    setLoading(false)
  }

  function abrirNovo() {
    setForm(FORM_VAZIO)
    setEditando(null)
    setCriando(true)
  }

  function abrirEdicao(edital: Edital) {
    setForm({
      orgao: edital.orgao,
      cargo: edital.cargo,
      banca: edital.banca,
      area_concurso: edital.area_concurso,
      vagas: edital.vagas,
      data_prova: edital.data_prova,
      data_inscricao_fim: edital.data_inscricao_fim,
      link: edital.link,
      status: edital.status,
    })
    setEditando(edital)
    setCriando(true)
  }

  async function salvar() {
    if (!form.orgao.trim()) {
      toast.error("Informe o órgão do concurso")
      return
    }
    setSalvando(true)
    const supabase = createClient()
    const payload = {
      orgao: form.orgao.trim(),
      cargo: form.cargo?.trim() || null,
      banca: form.banca?.trim() || null,
      area_concurso: form.area_concurso,
      vagas: form.vagas || null,
      data_prova: form.data_prova || null,
      data_inscricao_fim: form.data_inscricao_fim || null,
      link: form.link?.trim() || null,
      status: form.status,
    }

    const { error } = editando
      ? await supabase.from("editais").update(payload).eq("id", editando.id)
      : await supabase.from("editais").insert(payload)

    setSalvando(false)

    if (error) {
      console.error("Erro ao salvar edital:", error)
      toast.error("Erro ao salvar edital: " + error.message)
      return
    }

    toast.success(editando ? "Edital atualizado" : "Edital criado")
    setCriando(false)
    carregar()
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    const supabase = createClient()
    const { error } = await supabase.from("editais").delete().eq("id", excluindo.id)
    if (error) {
      console.error("Erro ao excluir edital:", error)
      toast.error("Erro ao excluir edital")
    } else {
      toast.success("Edital excluído")
      setEditais((prev) => prev.filter((e) => e.id !== excluindo.id))
    }
    setExcluindo(null)
  }

  function formatarData(iso: string | null) {
    if (!iso) return "—"
    return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR")
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-fg">Editais</h1>
          <span className="text-xs text-muted font-mono">{editais.length}</span>
        </div>
        <button
          onClick={abrirNovo}
          className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
        >
          NOVO EDITAL →
        </button>
      </div>

      {loading ? (
        <div className="text-muted text-sm">Carregando...</div>
      ) : editais.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-sm text-muted">Nenhum edital cadastrado ainda</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left">
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Órgão</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Área</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Data da prova</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Status</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {editais.map((edital) => (
                <tr key={edital.id} className="border-b border-card-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium">{edital.orgao}</div>
                    {edital.cargo && <div className="text-muted text-xs">{edital.cargo}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{edital.area_concurso}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{formatarData(edital.data_prova)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[edital.status]}`}>
                      {STATUS_LABEL[edital.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => abrirEdicao(edital)} className="text-[11px] text-accent hover:underline font-medium">
                        EDITAR
                      </button>
                      <button onClick={() => setExcluindo(edital)} className="text-[11px] text-red-400 hover:underline font-medium">
                        EXCLUIR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {criando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000088" }}>
          <div className="bg-card border border-card-border rounded-card p-6 w-full max-w-lg space-y-4">
            <h3 className="text-foreground font-bold text-base">{editando ? "Editar Edital" : "Novo Edital"}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1.5 font-mono">Órgão *</label>
                <input
                  value={form.orgao}
                  onChange={(e) => setForm({ ...form, orgao: e.target.value })}
                  className="field h-10"
                  placeholder="Ex: Polícia Federal"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Cargo</label>
                <input
                  value={form.cargo || ""}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  className="field h-10"
                  placeholder="Ex: Agente Administrativo"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Banca</label>
                <input
                  value={form.banca || ""}
                  onChange={(e) => setForm({ ...form, banca: e.target.value })}
                  className="field h-10"
                  placeholder="Ex: CESPE/CEBRASPE"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Área</label>
                <select
                  value={form.area_concurso}
                  onChange={(e) => setForm({ ...form, area_concurso: e.target.value })}
                  className="field h-10"
                >
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Vagas</label>
                <input
                  type="number"
                  value={form.vagas ?? ""}
                  onChange={(e) => setForm({ ...form, vagas: e.target.value ? Number(e.target.value) : null })}
                  className="field h-10"
                  placeholder="Ex: 120"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Data da prova</label>
                <input
                  type="date"
                  value={form.data_prova || ""}
                  onChange={(e) => setForm({ ...form, data_prova: e.target.value || null })}
                  className="field h-10"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Fim das inscrições</label>
                <input
                  type="date"
                  value={form.data_inscricao_fim || ""}
                  onChange={(e) => setForm({ ...form, data_inscricao_fim: e.target.value || null })}
                  className="field h-10"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Edital["status"] })}
                  className="field h-10"
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted mb-1.5 font-mono">Link do edital</label>
                <input
                  value={form.link || ""}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="field h-10"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setCriando(false)} className="px-4 py-2 text-sm border border-card-border rounded-lg text-muted hover:text-foreground transition-colors">
                CANCELAR
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                {salvando ? "Salvando…" : editando ? "SALVAR ALTERAÇÕES" : "CRIAR EDITAL"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!excluindo}
        title="Excluir edital"
        description={`Tem certeza que deseja excluir o edital de "${excluindo?.orgao}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmDestructive
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </motion.div>
  )
}
