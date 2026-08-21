"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { UploadZone } from "@/components/admin/UploadZone"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { MATERIAS, BANCAS, AREAS } from "@/lib/constants"
import type { QuestaoExtraida } from "@/lib/importar-questoes/schema"

type Tab = "pdf" | "url"

export default function ImportarQuestoesPage() {
  const [tab, setTab] = useState<Tab>("pdf")
  const [file, setFile] = useState<File | null>(null)
  const [urlsText, setUrlsText] = useState("")
  const [bancaHint, setBancaHint] = useState("")
  const [areaConcurso, setAreaConcurso] = useState("")
  const [loading, setLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoExtraida[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function parsePdf() {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.set("file", file)
      if (bancaHint) form.set("bancaHint", bancaHint)
      const res = await fetch("/api/admin/questoes/importar/parse", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Falha ao extrair")
      setJobId(data.jobId ?? null)
      setQuestoes(data.questoes ?? [])
      if (!data.questoes?.length) toast.error("Nenhuma questão A–E encontrada no PDF")
      else toast.success(`${data.questoes.length} questão(ões) extraída(s) — revise antes de confirmar`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function parseUrls() {
    const urls = urlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!urls.length) {
      toast.error("Cole ao menos 1 URL")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/admin/questoes/importar/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, bancaHint: bancaHint || null, areaConcurso: areaConcurso || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Falha ao extrair")
      setJobId(data.jobId ?? null)
      setQuestoes(data.questoes ?? [])
      if (!data.questoes?.length) toast.error("Nenhuma questão A–E encontrada nas URLs")
      else toast.success(`${data.questoes.length} questão(ões) extraída(s)`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function atualizar(idx: number, patch: Partial<QuestaoExtraida>) {
    setQuestoes((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)))
  }

  function atualizarAlternativa(qIdx: number, aIdx: number, texto: string) {
    setQuestoes((prev) =>
      prev.map((q, i) =>
        i !== qIdx ? q : { ...q, alternativas: q.alternativas.map((a, j) => (j === aIdx ? { ...a, texto } : a)) },
      ),
    )
  }

  const algumaInvalida = questoes.some(
    (q) => q.alternativas.some((a) => !a.texto.trim()) || q.resposta_correta === null,
  )

  async function confirmar() {
    setConfirmando(true)
    try {
      const res = await fetch("/api/admin/questoes/importar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, questoes, areaConcurso: areaConcurso || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? JSON.stringify(data.erros ?? data))
      toast.success(`${data.total} questão(ões) importada(s)`)
      setQuestoes([])
      setJobId(null)
      setFile(null)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setConfirmando(false)
      setShowConfirm(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Importar questões</h1>
        <p className="text-sm text-muted mt-1">
          Extraia de <strong>PDF</strong> ou <strong>URLs</strong> com IA (prompt de <code>extrator.md</code>). Preview obrigatório antes de gravar.
        </p>
      </div>

      <div className="flex gap-2 border-b border-card-border">
        {(["pdf", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"}`}
          >
            {t === "pdf" ? "PDF" : "URLs"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-card p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-xs font-mono text-muted">Banca (hint p/ IA)</span>
            <select value={bancaHint} onChange={(e) => setBancaHint(e.target.value)} className="field">
              <option value="">— detectar no texto —</option>
              {BANCAS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-mono text-muted">Área do concurso (para o upsert)</span>
            <select value={areaConcurso} onChange={(e) => setAreaConcurso(e.target.value)} className="field">
              <option value="">— sem vincular —</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>

        {tab === "pdf" ? (
          <div className="space-y-3">
            <UploadZone onFile={setFile} accept=".pdf" maxSizeMB={20} label="Arraste o PDF da prova ou clique para selecionar (até 20 MB, 200 págs)" />
            {file && <p className="text-xs text-muted font-mono">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            <button
              onClick={parsePdf}
              disabled={!file || loading}
              className="px-4 py-2 rounded-lg bg-accent text-[var(--text-on-accent)] text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Extraindo com IA…" : "Extrair do PDF"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-xs font-mono text-muted">URLs (1 por linha, até 10)</span>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder="https://exemplo.com/prova-1&#10;https://exemplo.com/prova-2"
                className="field min-h-[90px] py-2"
                rows={4}
              />
            </label>
            <button
              onClick={parseUrls}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-accent text-[var(--text-on-accent)] text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Extraindo com IA…" : "Extrair das URLs"}
            </button>
          </div>
        )}
      </div>

      {questoes.length > 0 && (
        <div className="bg-card border border-card-border rounded-card overflow-hidden">
          <div className="p-4 border-b border-card-border flex items-center justify-between">
            <span className="text-sm font-medium text-fg">
              Preview — {questoes.length} questão(ões) {jobId && <span className="text-muted font-mono text-xs">· job {jobId.slice(0, 8)}</span>}
            </span>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={algumaInvalida || confirmando}
              title={algumaInvalida ? "Corrija alternativas vazias e gabarito antes de confirmar" : undefined}
              className="px-4 py-1.5 rounded-lg bg-accent text-[var(--text-on-accent)] text-sm font-semibold disabled:opacity-50"
            >
              Confirmar importação
            </button>
          </div>

          <div className="divide-y divide-card-border max-h-[60vh] overflow-auto">
            {questoes.map((q, idx) => {
              const semGabarito = q.resposta_correta === null
              const baixaConfianca = q.confianca < 0.7
              const altVazia = q.alternativas.some((a) => !a.texto.trim())
              return (
                <div key={idx} className={`p-4 space-y-3 ${semGabarito ? "bg-yellow-500/5" : ""} ${altVazia ? "bg-red-500/5" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-mono text-muted">#{q.ordem} · {q.materia}</span>
                    <span className="flex gap-2 text-xs">
                      {semGabarito && <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600 border border-yellow-400/30">Sem gabarito — revisar</span>}
                      {baixaConfianca && <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-600">Baixa confiança</span>}
                      {altVazia && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 border border-red-500/30">Alternativa vazia</span>}
                    </span>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-mono text-muted">Matéria</span>
                    <select value={q.materia} onChange={(e) => atualizar(idx, { materia: e.target.value })} className="field">
                      {MATERIAS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-mono text-muted">Enunciado (KaTeX: \( \) / \[ \])</span>
                    <textarea value={q.enunciado} onChange={(e) => atualizar(idx, { enunciado: e.target.value })} className="field min-h-[70px] py-2" rows={3} />
                  </label>

                  <div className="grid gap-2">
                    {q.alternativas.map((alt, aIdx) => (
                      <label key={aIdx} className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${q.resposta_correta === aIdx ? "bg-accent text-[var(--text-on-accent)] border-accent" : "bg-card border-card-border text-muted"}`}>
                          {alt.letra}
                        </span>
                        <input
                          value={alt.texto}
                          onChange={(e) => atualizarAlternativa(idx, aIdx, e.target.value)}
                          placeholder={`Alternativa ${alt.letra}`}
                          className={`field flex-1 ${!alt.texto.trim() ? "border-red-500" : ""}`}
                        />
                        <button
                          type="button"
                          onClick={() => atualizar(idx, { resposta_correta: aIdx })}
                          className={`text-xs px-2 py-1 rounded-full border ${q.resposta_correta === aIdx ? "bg-accent border-accent text-[var(--text-on-accent)]" : "border-card-border text-muted hover:bg-card-hover"}`}
                        >
                          Gabarito
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirm}
        title="Confirmar importação"
        description={`Importar ${questoes.length} questão(ões) com upsert por codigo_importacao? Itens sem gabarito serão barrados.`}
        confirmLabel={confirmando ? "Importando…" : "Confirmar"}
        loading={confirmando}
        onConfirm={confirmar}
        onCancel={() => setShowConfirm(false)}
      />
    </motion.div>
  )
}
