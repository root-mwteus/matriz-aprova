"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { createClient } from "@/lib/supabase/client"
import { MATERIAS } from "@/lib/constants"
import type { Question } from "@/types"

const NIVEL_STYLE: Record<string, string> = {
  facil: "text-green-400 bg-green-400/10 border border-green-400/30",
  medio: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30",
  dificil: "text-red-400 bg-red-400/10 border border-red-400/30",
}

const NIVEL_LABEL: Record<string, string> = {
  facil: "FÁCIL",
  medio: "MÉDIO",
  dificil: "DIFÍCIL",
}

export default function AdminQuestoesPage() {
  const router = useRouter()
  const [questoes, setQuestoes] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [excluindo, setExcluindo] = useState<Question | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
    if (filtro) {
      query = query.eq("materia", filtro)
    }
    const { data, error } = await query
    if (error) {
      console.error("Erro ao carregar questões:", error)
      toast.error("Erro ao carregar questões")
    } else {
      setQuestoes(data || [])
    }
    setLoading(false)
  }, [filtro])

  useEffect(() => {
    carregar()
  }, [carregar])

  function filtrar(materia: string) {
    setFiltro(materia)
  }

  async function confirmarExclusao() {
    if (!excluindo) return
    const supabase = createClient()
    const { error } = await supabase.from("questions").delete().eq("id", excluindo.id)
    if (error) {
      console.error("Erro ao excluir questão:", error)
      toast.error("Erro ao excluir questão")
    } else {
      toast.success("Questão excluída")
      setQuestoes((prev) => prev.filter((q) => q.id !== excluindo.id))
    }
    setExcluindo(null)
  }

  const alternativasOk = questoes.filter(
    (q) => q.alternativas.length >= 2 && q.alternativas.every((a) => a.text?.trim())
  ).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-fg">Questões</h1>
          <span className="text-xs text-muted font-mono">{questoes.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={filtro} onChange={(e) => filtrar(e.target.value)} className="field h-9 text-sm">
            <option value="">Todas as matérias</option>
            {MATERIAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={() => router.push("/admin/questoes/importar")}
            className="text-xs bg-card border border-card-border text-muted px-4 py-1.5 rounded-lg font-semibold hover:bg-card-hover transition-colors"
          >
            IMPORTAR EM MASSA
          </button>
          <button
            onClick={() => router.push("/admin/questoes/novo")}
            className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
          >
            NOVA QUESTÃO
          </button>
        </div>
      </div>

      <div className="text-xs text-muted font-mono">
        {alternativasOk} com alternativas completas
      </div>

      {loading ? (
        <div className="text-muted text-sm">Carregando...</div>
      ) : questoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">📝</span>
          <p className="text-sm text-muted">Nenhuma questão cadastrada ainda</p>
        </div>
      ) : (
        <div className="bg-card border border-card-border rounded-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left">
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Matéria</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Banca</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Ano</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Enunciado</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal">Nível</th>
                <th className="px-4 py-3 text-[11px] text-muted font-mono font-normal text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {questoes.map((q) => (
                <tr key={q.id} className="border-b border-card-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium">{q.materia}</div>
                    {q.sub_materia && <div className="text-muted text-xs">{q.sub_materia}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{q.banca || "—"}</td>
                  <td className="px-4 py-3 text-muted font-mono text-xs">{q.ano || "—"}</td>
                  <td className="px-4 py-3 max-w-md">
                    <p className="text-xs text-foreground/80 line-clamp-2">{q.enunciado}</p>
                  </td>
                  <td className="px-4 py-3">
                    {q.nivel ? (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${NIVEL_STYLE[q.nivel]}`}>
                        {NIVEL_LABEL[q.nivel]}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => router.push(`/admin/questoes/${q.id}/editar`)} className="text-[11px] text-accent hover:underline font-medium">
                        EDITAR
                      </button>
                      <button onClick={() => setExcluindo(q)} className="text-[11px] text-red-400 hover:underline font-medium">
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

      <ConfirmModal
        open={!!excluindo}
        title="Excluir questão"
        description="Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        confirmDestructive
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </motion.div>
  )
}
