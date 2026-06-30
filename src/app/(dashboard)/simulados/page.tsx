"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import type { Question } from "@/types"
import PageHeader from "@/components/PageHeader"

const bancas = [
  "CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC",
  "CONSULPLAN", "QUADRIX", "CESGRANRIO",
]

const areas = [
  "Concursos Gerais", "OAB", "Militar", "ENEM",
]

const opcoesQuestoes = [10, 20, 30, 50]
const opcoesTempo = [
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
]

export default function SimuladosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [banca, setBanca] = useState("")
  const [area, setArea] = useState("")
  const [numQuestoes, setNumQuestoes] = useState(20)
  const [tempo, setTempo] = useState(120)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleIniciar = useCallback(async () => {
    setLoading(true)
    setError("")

    let query = supabase.from("questions").select("*")

    if (banca) query = query.eq("banca", banca)
    query = query.limit(numQuestoes * 2)
    query = query.order("created_at", { ascending: false })

    const { data, error: err } = await query

    if (err || !data || data.length === 0) {
      setError("Nenhuma questão encontrada com esses filtros")
      setLoading(false)
      return
    }

    const embaralhadas = data.sort(() => Math.random() - 0.5).slice(0, numQuestoes)

    const questoesData = embaralhadas.map((q: Question) => ({
      id: q.id,
      materia: q.materia,
      resposta_correta: q.resposta_correta,
    }))

    const { data: { user } } = await supabase.auth.getUser()

    const { data: sim, error: insertErr } = await supabase
      .from("simulations")
      .insert({
        user_id: user?.id,
        questoes: questoesData,
        pontuacao: -1,
        tempo_total: 0,
      })
      .select()
      .single()

    if (insertErr || !sim) {
      setError("Erro ao criar simulado")
      setLoading(false)
      return
    }

    localStorage.setItem(
      `sim_${sim.id}`,
      JSON.stringify({
        questoes: embaralhadas,
        respostas: {} as Record<string, number>,
        tempoLimite: tempo,
        inicio: Date.now(),
      })
    )

    router.push(`/simulados/${sim.id}`)
    setLoading(false)
  }, [banca, numQuestoes, tempo, supabase, router])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <PageHeader
          badge="SIMULADOS"
          title="Teste seu conhecimento"
          subtitle="Simule condições reais de prova"
        />
        <a
          href="/simulados/ranking"
          className="text-xs text-[#666666] hover:text-[#CBFF4D] transition-colors font-mono mt-1"
        >
          [ ranking ]
        </a>
      </div>

      {/* CONFIGURAÇÃO */}
      <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5 space-y-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666]">
          NOVO SIMULADO
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Banca</label>
            <select
              value={banca}
              onChange={(e) => setBanca(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-card px-4 py-3.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#CBFF4D] transition-colors"
            >
              <option value="">Todas as bancas</option>
              {bancas.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-card px-4 py-3.5 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#CBFF4D] transition-colors"
            >
              <option value="">Todas as áreas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Número de questões</label>
            <div className="grid grid-cols-4 gap-2">
              {opcoesQuestoes.map((n) => (
                <button
                  key={n}
                  onClick={() => setNumQuestoes(n)}
                  className={`py-3 rounded-card text-sm font-semibold transition-all ${
                    numQuestoes === n
                      ? "bg-[#CBFF4D] text-[#000000] font-bold"
                      : "bg-[#0D0D0D] border border-[#2A2A2A] text-[#666666] hover:text-[#FFFFFF]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Tempo limite</label>
            <div className="grid grid-cols-3 gap-2">
              {opcoesTempo.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTempo(t.value)}
                  className={`py-3 rounded-card text-sm font-semibold transition-all ${
                    tempo === t.value
                      ? "bg-[#CBFF4D] text-[#000000] font-bold"
                      : "bg-[#0D0D0D] border border-[#2A2A2A] text-[#666666] hover:text-[#FFFFFF]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#FF4D4D] bg-[#FF4D4D10] border border-[#FF4D4D30] rounded-card px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleIniciar}
          disabled={loading}
          className="w-full bg-[#CBFF4D] text-[#000000] font-bold py-3.5 rounded-card text-[13px] uppercase tracking-[0.08em] hover:opacity-88 transition-opacity disabled:opacity-50"
        >
          {loading ? "SELECIONANDO QUESTÕES..." : "INICIAR SIMULADO →"}
        </button>
      </div>

      <UltimosResultados />
    </motion.div>
  )
}

function UltimosResultados() {
  const supabase = createClient()
  const [resultados, setResultados] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("simulations")
        .select("*")
        .eq("user_id", user.id)
        .not("pontuacao", "eq", -1)
        .order("created_at", { ascending: false })
        .limit(5)
        .then(({ data }) => {
          if (data) setResultados(data)
        })
    })
  }, [supabase])

  if (resultados.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666]">
        ÚLTIMOS RESULTADOS
      </h3>
      <div className="space-y-2">
        {resultados.map((r) => {
          const totalQuestoes = (r.questoes as any[])?.length || 0
          const pct = totalQuestoes > 0 ? Math.round((r.pontuacao / totalQuestoes) * 100) : 0
          return (
            <a
              key={r.id}
              href={`/simulados/resultado/${r.id}`}
              className="block bg-CARD] border border-[#2A2A2A] rounded-card p-4 hover:border-[#CBFF4D]/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-[#CBFF4D]">
                    {r.pontuacao}/{totalQuestoes}
                  </span>
                  <span className="text-xs text-[#666666] ml-2">{pct}%</span>
                </div>
                <span className="text-xs text-[#666666]">
                  {Math.floor(r.tempo_total / 60)}m
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
