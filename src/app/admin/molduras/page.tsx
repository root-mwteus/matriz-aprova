"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { UploadZone } from "@/components/admin/UploadZone"
import { createClient } from "@/lib/supabase/client"
import { publicUrl } from "@/lib/perfil"
import { Button, Panel, Select } from "@/components/ui"
import type { Moldura } from "@/types"

/**
 * Admin: catálogo de molduras de avatar.
 *
 * Formato definido: PNG quadrado 512×512 com transparência. O arquivo
 * sobe para o bucket público `molduras` como `<slug>.png` e a linha da
 * tabela guarda o caminho; o desbloqueio decide quem pode usar
 * ('livre' para todos, 'vitalicio' só para assinantes).
 */

export default function AdminMoldurasPage() {
  const supabase = createClient()
  const [molduras, setMolduras] = useState<Moldura[]>([])
  const [loading, setLoading] = useState(true)

  const [slug, setSlug] = useState("")
  const [nome, setNome] = useState("")
  const [desbloqueio, setDesbloqueio] = useState<Moldura["desbloqueio"]>("livre")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState<Moldura | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("molduras").select("*").order("nome")
    if (error) {
      toast.error("Erro ao carregar molduras")
    } else {
      setMolduras((data as Moldura[] | null) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function criar() {
    const slugLimpo = slug.trim().toLowerCase().replace(/\s+/g, "-")
    if (!slugLimpo || !nome.trim() || !arquivo) {
      toast.error("Preencha slug, nome e selecione o PNG")
      return
    }
    setSalvando(true)
    try {
      const { error: up } = await supabase.storage
        .from("molduras")
        .upload(`${slugLimpo}.png`, arquivo, { upsert: true })
      if (up) throw new Error("Falha ao enviar o PNG")

      const { error } = await supabase.from("molduras").insert({
        slug: slugLimpo,
        nome: nome.trim(),
        arquivo: `${slugLimpo}.png`,
        desbloqueio,
      })
      if (error) throw new Error("Falha ao salvar a moldura")

      toast.success("Moldura criada")
      setSlug("")
      setNome("")
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ""
      carregar()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar moldura")
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    if (!excluindo) return
    const { error } = await supabase.from("molduras").delete().eq("id", excluindo.id)
    if (error) {
      toast.error("Erro ao excluir moldura")
    } else {
      await supabase.storage.from("molduras").remove([excluindo.arquivo]).catch(() => {})
      toast.success("Moldura excluída")
      carregar()
    }
    setExcluindo(null)
  }

  return (
    <div className="animate-rise space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Molduras</h1>
        <p className="mt-1 text-sm text-fg-muted">
          PNG quadrado 512×512 com transparência — sobe como <code>&lt;slug&gt;.png</code> no bucket
          público molduras.
        </p>
      </div>

      <Panel>
        <h2 className="text-sm font-semibold text-fg">Nova moldura</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-fg-subtle">Slug</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="dourada"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent-ink"
            />
          </label>
          <label className="block">
            <span className="text-xs text-fg-subtle">Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Moldura dourada"
              className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent-ink"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs text-fg-subtle">Desbloqueio</span>
          <Select
            value={desbloqueio}
            onChange={(e) => setDesbloqueio(e.target.value as Moldura["desbloqueio"])}
            className="mt-1"
          >
            <option value="livre">Livre — qualquer plano</option>
            <option value="vitalicio">Vitalício — só assinantes</option>
          </Select>
        </label>
        <div className="mt-3">
          <UploadZone
            accept="image/png"
            label="Selecione o PNG da moldura (512×512, transparente)"
            maxSizeMB={2}
            onFile={setArquivo}
          />
        </div>
        <Button variant="accent" className="mt-4" onClick={criar} disabled={salvando}>
          <ImagePlus size={15} strokeWidth={2} /> {salvando ? "Criando…" : "Criar moldura"}
        </Button>
      </Panel>

      <Panel flush>
        <ul className="divide-y divide-line">
          {loading ? (
            <li className="px-4 py-4 text-sm text-fg-subtle">Carregando…</li>
          ) : molduras.length === 0 ? (
            <li className="px-4 py-4 text-sm text-fg-subtle">Nenhuma moldura criada ainda.</li>
          ) : (
            molduras.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={publicUrl("molduras", m.arquivo)}
                  alt={m.nome}
                  className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface-sunken object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{m.nome}</p>
                  <p className="truncate text-xs text-fg-subtle">
                    {m.slug} · {m.desbloqueio === "vitalicio" ? "vitalício" : "livre"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExcluindo(m)}>
                  <Trash2 size={14} strokeWidth={2} />
                </Button>
              </li>
            ))
          )}
        </ul>
      </Panel>

      <ConfirmModal
        open={Boolean(excluindo)}
        title="Excluir moldura?"
        description={excluindo ? `A moldura "${excluindo.nome}" será removida e quem a usava volta ao padrão.` : ""}
        confirmLabel="Excluir"
        confirmDestructive
        loading={salvando}
        onConfirm={excluir}
        onCancel={() => setExcluindo(null)}
      />
    </div>
  )
}