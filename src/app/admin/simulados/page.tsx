"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { MetricCard } from "@/components/admin/MetricCard"
import { AdminTable } from "@/components/admin/AdminTable"

const PAGE_SIZE = 10

interface Resumo {
  realizadoHoje: number
  realizadoSemana: number
  total: number
  mediaPontuacao: number
  piorMateria: { materia: string; pct: number } | null
}

interface RankingEntry {
  id: string
  aluno: string
  area: string
  pontuacao: number
  simulados: number
  ultima: string
}

interface HistoricoEntry {
  id: string
  aluno: string
  banca: string
  questoes: number
  acertos: number
  pct: number
  tempo: string
  data: string
}

interface SimuladosDados {
  resumo: Resumo
  ranking: RankingEntry[]
  historico: HistoricoEntry[]
}

function Medal({ pos }: { pos: number }) {
  const medals = ["🥇", "🥈", "🥉"]
  return pos <= 3 ? <span>{medals[pos - 1]}</span> : <span className="text-muted font-mono">{pos}</span>
}

export default function AdminSimuladosPage() {
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<SimuladosDados | null>(null)

  useEffect(() => {
    let active = true

    fetch("/api/admin/simulados")
      .then((res) => res.json())
      .then((data: SimuladosDados) => {
        if (!active || (data as any).error) return
        setDados(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Erro ao carregar simulados admin:", err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const historico = dados?.historico ?? []
  const paginado = historico.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-xl font-semibold text-fg">Simulados</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="REALIZADOS HOJE/SEMANA/TOTAL"
          value={loading ? "—" : `${dados?.resumo.realizadoHoje ?? 0} / ${dados?.resumo.realizadoSemana ?? 0} · ${dados?.resumo.total ?? 0}`}
        />
        <MetricCard label="MÉDIA DE PONTUAÇÃO" value={loading ? "—" : `${dados?.resumo.mediaPontuacao ?? 0}%`} />
        <MetricCard
          label="PIOR MATÉRIA"
          value={loading ? "—" : (dados?.resumo.piorMateria?.materia ?? "—")}
          variacao={dados?.resumo.piorMateria ? `${dados.resumo.piorMateria.pct}% de acertos — refaça o plano` : undefined}
          variacaoPositiva={false}
        />
      </div>

      <div className="bg-card border border-card-border rounded-card">
        <div className="text-[11px] text-muted font-mono px-5 pt-4 pb-2">/ RANKING GERAL</div>
        <AdminTable
          loading={loading}
          columns={[
            {
              key: "pos",
              header: "POS",
              render: (_row: any, idx: number) => <Medal pos={idx + 1} />,
            },
            { key: "aluno", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.aluno}</span> },
            { key: "area", header: "Área", render: (row) => <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">{row.area}</span> },
            { key: "pontuacao", header: "PONTUAÇÃO", render: (row) => <span className="text-accent font-semibold font-mono">{row.pontuacao}%</span> },
            { key: "simulados", header: "SIMULADOS", render: (row) => <span className="text-muted font-mono">{row.simulados}</span> },
            { key: "ultima", header: "ÚLTIMA PROVA", render: (row) => <span className="text-muted font-mono text-xs">{row.ultima}</span> },
          ]}
          data={dados?.ranking ?? []}
        />
      </div>

      <div className="bg-card border border-card-border rounded-card">
        <div className="flex items-center gap-3 px-5 pt-4 pb-2">
          <span className="text-[11px] text-muted font-mono">/ SIMULADOS REALIZADOS</span>
          <button
            onClick={() => {
              const csv = [
                ["Aluno", "Banca", "Questões", "Acertos", "%", "Tempo", "Data"].join(";"),
                ...historico.map((h) => [h.aluno, h.banca, h.questoes, h.acertos, h.pct, h.tempo, h.data].join(";")),
              ].join("\n")
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = "simulados.csv"
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="ml-auto text-xs border border-card-border text-muted hover:text-foreground px-2 py-1 rounded-lg transition-colors"
          >
            Exportar CSV
          </button>
        </div>
        <AdminTable
          loading={loading}
          columns={[
            { key: "aluno", header: "ALUNO", render: (row) => <span className="text-foreground text-sm">{row.aluno}</span> },
            { key: "banca", header: "BANCA" },
            { key: "questoes", header: "Q", render: (row) => <span className="font-mono">{row.questoes}</span> },
            { key: "acertos", header: "ACERTOS", render: (row) => <span className="font-mono">{row.acertos}</span> },
            { key: "pct", header: "%", render: (row) => <span className="font-mono text-accent">{row.pct}%</span> },
            { key: "tempo", header: "TEMPO TOTAL", render: (row) => <span className="font-mono text-xs text-muted">{row.tempo}</span> },
            { key: "data", header: "DATA", render: (row) => <span className="font-mono text-xs text-muted">{row.data}</span> },
          ]}
          data={paginado}
          page={page}
          total={historico.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </motion.div>
  )
}
