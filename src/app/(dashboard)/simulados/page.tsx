"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AREAS, BANCAS } from "@/lib/constants"
import type { Question } from "@/types"
import { cn } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import { Badge, Button, Field, Panel, PanelHeader, Progress, Select } from "@/components/ui"

/**
 * Configuração de simulado.
 *
 * O formulário estava numa coluna única com campos de 3.5rem de altura,
 * exigindo rolagem para ver o botão de iniciar. Agora cabe numa tela: os
 * dois selects dividem a linha, e quantidade e tempo — que são escolhas
 * entre poucas opções fixas — viraram grupos de opção, não selects.
 *
 * A previsão de duração ("20 questões em 2h ≈ 6min por questão") apareceu
 * porque é a conta que a pessoa faz de cabeça antes de decidir.
 */

const OPCOES_QUESTOES = [10, 20, 30, 50]
const OPCOES_TEMPO = [
  { label: "1h", value: 60 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
]

interface SimuladoCatalogo {
  id: string
  titulo: string
  area: string
  prova: string
  quantidade: number
  duracao_min: number
  descricao: string | null
}

export default function SimuladosPage() {
  const router = useRouter()
  const supabase = createClient()
  const [banca, setBanca] = useState("")
  const [area, setArea] = useState("")
  const [catalogos, setCatalogos] = useState<SimuladoCatalogo[]>([])
  const [catalogoId, setCatalogoId] = useState("")
  const [numQuestoes, setNumQuestoes] = useState(20)
  const [tempo, setTempo] = useState(120)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    createClient()
      .from("simulados_catalogo")
      .select("id, titulo, area, prova, quantidade, duracao_min, descricao")
      .order("area")
      .order("titulo")
      .then(({ data }) => {
        if (data) setCatalogos(data as SimuladoCatalogo[])
      })
  }, [])

  const handleIniciar = useCallback(async () => {
    setLoading(true)
    setError("")

    let data: Question[] = []
    let err: unknown = null

    if (catalogoId) {
      const { data: vinculos, error: vinculosError } = await supabase
        .from("simulados_catalogo_questoes")
        .select("question_id, ordem")
        .eq("simulado_id", catalogoId)
        .order("ordem")

      if (vinculosError || !vinculos?.length) {
        err = vinculosError
      } else {
        const ids = vinculos.map((v: { question_id: string }) => v.question_id)
        const { data: questoes, error: questoesError } = await supabase
          .from("questions")
          .select("*")
          .in("id", ids)
        err = questoesError
        const porId = new Map((questoes ?? []).map((q: Question) => [q.id, q]))
        data = vinculos
          .map((v: { question_id: string }) => porId.get(v.question_id))
          .filter((q: Question | undefined): q is Question => Boolean(q))
      }
    } else {
      let query = supabase.from("questions").select("*")
      if (banca) query = query.eq("banca", banca)
      if (area) query = query.eq("area_concurso", area)
      query = query.limit(numQuestoes * 2)
      query = query.order("created_at", { ascending: false })
      const resultado = await query
      data = (resultado.data ?? []) as Question[]
      err = resultado.error
    }

    if (err || !data || data.length === 0) {
      setError("Nenhuma questão encontrada com esses filtros. Tente ampliar a banca ou a área.")
      setLoading(false)
      return
    }

    const embaralhadas = catalogoId ? data : data.sort(() => Math.random() - 0.5).slice(0, numQuestoes)
    const questoesData = embaralhadas.map((q: Question) => ({
      id: q.id,
      materia: q.materia,
      resposta_correta: q.resposta_correta,
    }))

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: sim, error: insertErr } = await supabase
      .from("simulations")
      .insert({ user_id: user?.id, questoes: questoesData, pontuacao: -1, tempo_total: 0 })
      .select()
      .single()

    if (insertErr || !sim) {
      setError("Erro ao criar o simulado. Tente novamente.")
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
  }, [banca, area, catalogoId, numQuestoes, tempo, supabase, router])

  const minutosPorQuestao = (tempo / numQuestoes).toFixed(1).replace(".", ",")

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Simulados"
        subtitle="Monte uma prova com as suas condições e cronometre do começo ao fim."
        actions={
          <Button variant="secondary" onClick={() => router.push("/simulados/ranking")}>
            <Trophy size={14} strokeWidth={1.75} />
            Ranking
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel flush className="lg:col-span-2">
          <PanelHeader title="Novo simulado" description="Escolha um caderno completo ou monte uma prova por filtros." />

          <div className="space-y-5 p-4">
            {catalogos.length > 0 && (
              <Field label="Caderno completo">
                {(props) => (
                  <Select
                    {...props}
                    value={catalogoId}
                    onChange={(e) => {
                      const id = e.target.value
                      const escolhido = catalogos.find((item) => item.id === id)
                      setCatalogoId(id)
                      if (escolhido) {
                        setNumQuestoes(escolhido.quantidade)
                        setTempo(escolhido.duracao_min)
                      }
                    }}
                  >
                    <option value="">Montar por filtros</option>
                    {catalogos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.titulo} · {item.quantidade} questões · {item.duracao_min} min
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}

            {catalogoId && (
              <p className="rounded-md border border-line-accent bg-accent-soft px-3 py-2 text-sm text-fg">
                {catalogos.find((item) => item.id === catalogoId)?.descricao ||
                  "Este caderno usa questões em ordem fixa e gabarito validado no servidor."}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Área">
                {(props) => (
                  <Select {...props} disabled={Boolean(catalogoId)} value={area} onChange={(e) => setArea(e.target.value)}>
                    <option value="">Todas as áreas</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Banca">
                {(props) => (
                  <Select {...props} disabled={Boolean(catalogoId)} value={banca} onChange={(e) => setBanca(e.target.value)}>
                    <option value="">Todas as bancas</option>
                    {BANCAS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <GrupoOpcoes
              label="Número de questões"
              value={numQuestoes}
              onChange={setNumQuestoes}
              options={
                catalogoId
                  ? [{ value: numQuestoes, label: String(numQuestoes) }]
                  : OPCOES_QUESTOES.map((n) => ({ value: n, label: String(n) }))
              }
            />

            <GrupoOpcoes
              label="Tempo limite"
              value={tempo}
              onChange={setTempo}
              options={catalogoId ? [{ value: tempo, label: `${tempo} min` }] : OPCOES_TEMPO}
            />

            {error && (
              <p
                role="alert"
                className="rounded-md border border-[color:var(--negative)]/25 bg-negative-soft px-3 py-2 text-sm text-negative"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
            <p className="text-sm text-fg-subtle">
              {numQuestoes} questões · {minutosPorQuestao} min por questão
            </p>
            <Button variant="accent" loading={loading} onClick={handleIniciar}>
              Iniciar simulado
            </Button>
          </div>
        </Panel>

        <UltimosResultados />
      </div>
    </div>
  )
}

/**
 * Grupo de opções mutuamente exclusivas.
 *
 * Usa `radiogroup` em vez de botões soltos: com papel de rádio, as setas
 * do teclado percorrem as opções e o leitor de tela anuncia "2 de 4".
 */
function GrupoOpcoes<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-fg">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "h-9 min-w-[64px] rounded-md border px-3 text-sm font-medium",
                "transition-[background-color,border-color,color] duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                active
                  ? "border-line-accent bg-accent-soft text-fg"
                  : "border-line-strong bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
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
    <Panel flush className="h-fit">
      <PanelHeader title="Últimos resultados" />
      <ul>
        {resultados.map((r) => {
          const total = r.questoes?.length || 0
          const pct = total > 0 ? Math.round((r.pontuacao / total) * 100) : 0
          return (
            <li key={r.id} className="border-b border-line last:border-0">
              <Link
                href={`/simulados/resultado/${r.id}`}
                className="block px-4 py-3 transition-colors duration-fast hover:bg-surface-hover"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium tabular-nums text-fg">
                    {r.pontuacao}/{total}
                  </span>
                  <Badge tone={pct >= 70 ? "positive" : pct >= 50 ? "caution" : "negative"} size="sm">
                    {pct}%
                  </Badge>
                </div>
                <Progress
                  value={pct}
                  size="sm"
                  tone={pct >= 70 ? "positive" : pct >= 50 ? "caution" : "negative"}
                  className="mt-2"
                />
                <p className="mt-1.5 text-xs text-fg-subtle">
                  {Math.floor(r.tempo_total / 60)} min
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-line px-4 py-2.5">
        <Link
          href="/simulados/ranking"
          className="inline-flex items-center gap-1 text-sm text-fg-subtle transition-colors duration-fast hover:text-fg"
        >
          Ver ranking
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      </div>
    </Panel>
  )
}
