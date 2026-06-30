"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { QuestaoForm, emptyDraft, validarDraft, draftToRow, type QuestaoDraft } from "@/components/admin/QuestaoForm"
import type { QuestaoFigura } from "@/types"

export default function EditarQuestaoPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  const [draft, setDraft] = useState<QuestaoDraft>(emptyDraft())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase
      .from("questions")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) {
          setNaoEncontrada(true)
          setLoading(false)
          return
        }
        const alts = (data.alternativas as { letter: string; text: string }[]) || []
        const preenchidas = ["", "", "", "", ""]
        alts.forEach((a, i) => { if (i < 5) preenchidas[i] = a.text })
        setDraft({
          materia: data.materia,
          subMateria: data.sub_materia || "",
          banca: data.banca || "",
          ano: data.ano ? String(data.ano) : "",
          area: data.area_concurso || "",
          incidencia: data.incidencia_pct || 0,
          enunciado: data.enunciado,
          explicacao: data.explicacao || "",
          referencias: data.referencias || "",
          alternativas: preenchidas,
          correta: data.resposta_correta,
          figuras: (data.figuras as QuestaoFigura[]) || [],
        })
        setLoading(false)
      })

    return () => { active = false }
  }, [params.id])

  async function handleSave() {
    const erro = validarDraft(draft)
    if (erro) {
      toast.error(erro)
      return
    }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("questions")
      .update(draftToRow(draft))
      .eq("id", params.id)
    setSaving(false)

    if (error) {
      console.error("Erro ao atualizar questão:", error)
      toast.error("Erro ao salvar: " + error.message)
      return
    }

    toast.success("Questão atualizada com sucesso")
    router.push(`/admin/questoes/${params.id}`)
    router.refresh()
  }

  if (loading) return <div className="text-muted text-sm">Carregando...</div>

  if (naoEncontrada) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-title uppercase">Editar Questão</h1>
          <Link href="/admin/questoes" className="text-sm text-muted hover:text-foreground transition-colors">← VOLTAR</Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">📝</span>
          <p className="text-sm text-muted">Questão não encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Editar Questão</h1>
        <Link href={`/admin/questoes/${params.id}`} className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-card p-6 space-y-6">
        <QuestaoForm value={draft} onChange={setDraft} />

        <div className="flex items-center justify-end pt-4 border-t border-[#2A2A2A]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-accent/20 text-accent border border-accent/40 px-6 py-2.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {saving ? "SALVANDO..." : "SALVAR ALTERAÇÕES →"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
