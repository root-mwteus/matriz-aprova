"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { AdminTable } from "@/components/admin/AdminTable"
import { ConfirmModal } from "@/components/admin/ConfirmModal"
import { createClient } from "@/lib/supabase/client"
import type { Question } from "@/types"

const PAGE_SIZE = 10

interface QuestaoRow extends Question {
  respondidas: number
  pct_acerto: number
}

function PctBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted font-mono">—</span>
  const color = value > 70 ? "text-green-400" : value > 40 ? "text-yellow-400" : "text-red-400"
  return <span className={`text-xs font-mono ${color}`}>{value}%</span>
}

export default function AdminQuestoesPage() {
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState("")
  const [materia, setMateria] = useState("")
  const [questoes, setQuestoes] = useState<QuestaoRow[]>([])
  const [materias, setMaterias] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [excluindo, setExcluindo] = useState<QuestaoRow | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("questions")
      .select("materia")
      .then(({ data }) => {
        if (data) setMaterias(Array.from(new Set(data.map((d) => d.materia))).sort())
      })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true
    setLoading(true)

    const timeout = setTimeout(async () => {
      const safe = busca.replace(/[%_,()]/g, "")
      let query = supabase.from("questions").select("*", { count: "exact" })

      if (safe) query = query.ilike("enunciado", `%${safe}%`)
      if (materia) query = query.eq("materia", materia)

      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, count, error } = await query.order("created_at", { ascending: false }).range(from, to)

      if (!active) return

      if (error) {
        console.error("Erro ao carregar questões:", error)
        toast.error("Erro ao carregar questões")
        setLoading(false)
        return
      }

      const lista = (data || []) as Question[]
      const ids = lista.map((q) => q.id)

      let respostasPorQuestao: Record<string, { total: number; corretas: number }> = {}
      if (ids.length > 0) {
        const { data: respostas } = await supabase
          .from("user_answers")
          .select("question_id, correto")
          .in("question_id", ids)

        respostasPorQuestao = (respostas || []).reduce((acc, r) => {
          const cur = acc[r.question_id] || { total: 0, corretas: 0 }
          cur.total += 1
          if (r.correto) cur.corretas += 1
          acc[r.question_id] = cur
          return acc
        }, {} as Record<string, { total: number; corretas: number }>)
      }

      const enriquecidas: QuestaoRow[] = lista.map((q) => {
        const r = respostasPorQuestao[q.id]
        return {
          ...q,
          respondidas: r?.total || 0,
          pct_acerto: r && r.total > 0 ? Math.round((r.corretas / r.total) * 100) : 0,
        }
      })

      setQuestoes(enriquecidas)
      setTotal(count || 0)
      setLoading(false)
    }, 300)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [busca, materia, page])

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
      setTotal((t) => t - 1)
    }
    setExcluindo(null)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Questões</h1>
          <span className="text-xs text-muted font-mono">{total}</span>
        </div>
        <Link
          href="/admin/questoes/nova"
          className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
        >
          NOVA QUESTÃO →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value)
            setPage(1)
          }}
          className="flex-1 min-w-[200px] bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          placeholder="Buscar por enunciado..."
        />
        <select
          value={materia}
          onChange={(e) => {
            setMateria(e.target.value)
            setPage(1)
          }}
          className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-accent"
        >
          <option value="">Todas matérias</option>
          {materias.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="bg-CARD border border-[#2A2A2A] rounded-card overflow-hidden">
        <AdminTable
          loading={loading}
          columns={[
            {
              key: "enunciado",
              header: "ENUNCIADO",
              render: (row) => (
                <div className="max-w-[300px]">
                  <span className="text-sm text-foreground">{row.enunciado.substring(0, 80)}{row.enunciado.length > 80 ? "..." : ""}</span>
                </div>
              ),
            },
            { key: "materia", header: "MATÉRIA", render: (row) => <span className="text-xs">{row.materia}</span> },
            {
              key: "banca",
              header: "BANCA · ANO",
              render: (row) => <span className="text-xs text-muted font-mono">{row.banca || "—"} · {row.ano || "—"}</span>,
            },
            { key: "respondidas", header: "RESPONDIDAS", render: (row) => <span className="text-xs text-muted font-mono">{row.respondidas}</span> },
            { key: "pct_acerto", header: "% ACERTO", render: (row) => <PctBadge value={row.pct_acerto} /> },
            {
              key: "acoes",
              header: "AÇÕES",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <Link href={`/admin/questoes/${row.id}`} className="text-[11px] text-accent hover:underline">VER</Link>
                  <Link href={`/admin/questoes/${row.id}/editar`} className="text-[11px] text-muted hover:text-foreground">EDITAR</Link>
                  <button onClick={() => setExcluindo(row)} className="text-[11px] text-red-400 hover:underline">EXCLUIR</button>
                </div>
              ),
            },
          ]}
          data={questoes}
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      <ConfirmModal
        open={!!excluindo}
        title="Excluir questão"
        description="Tem certeza que deseja excluir esta questão? Essa ação não pode ser desfeita."
        confirmLabel="EXCLUIR"
        confirmDestructive
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </motion.div>
  )
}
