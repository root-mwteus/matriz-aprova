"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { QuestaoForm, emptyDraft, validarDraft, draftToRow, type QuestaoDraft } from "@/components/admin/QuestaoForm"

export default function NovaQuestaoPage() {
  const router = useRouter()
  const [draft, setDraft] = useState<QuestaoDraft>(emptyDraft())
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function handleSave() {
    const erro = validarDraft(draft)
    if (erro) {
      toast.error(erro)
      return
    }

    setSaving(true)
    const { error } = await supabase.from("questions").insert(draftToRow(draft))
    setSaving(false)

    if (error) {
      console.error("Erro ao salvar questão:", error)
      toast.error("Erro ao salvar: " + error.message)
      return
    }

    toast.success("Questão criada com sucesso")
    router.push("/admin/questoes")
    router.refresh()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Nova Questão</h1>
        <Link href="/admin/questoes" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-card p-6 space-y-6">
        <QuestaoForm value={draft} onChange={setDraft} />

        <div className="flex items-center justify-end pt-4 border-t border-[#2A2A2A]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-accent/20 text-accent border border-accent/40 px-6 py-2.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {saving ? "SALVANDO..." : "CRIAR QUESTÃO →"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
