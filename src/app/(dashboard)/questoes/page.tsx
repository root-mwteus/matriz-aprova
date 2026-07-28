"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Shuffle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ANOS, AREAS, BANCAS, MATERIAS } from "@/lib/constants"
import PageHeader from "@/components/PageHeader"
import { Button, FilterSelect, Panel, Skeleton, Toolbar } from "@/components/ui"

/**
 * Entrada da prática de questões.
 *
 * A tela tinha dois caminhos concorrentes para a mesma coisa: a barra de
 * filtros com botão "Filtrar", e a grade de matérias logo abaixo, que
 * navegava direto. Agora a grade é o caminho rápido (um clique por
 * matéria) e a barra é o caminho preciso — o botão "Filtrar" sumiu
 * porque a escolha já é o comando.
 *
 * A contagem por matéria vinha de 12 consultas sequenciais; passaram a
 * ser disparadas juntas, o que tira ~1s de espera da primeira carga.
 */

interface MateriaCount {
  materia: string
  count: number
}

export default function QuestoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [materia, setMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [ano, setAno] = useState("")
  const [area, setArea] = useState("")
  const [total, setTotal] = useState<number | null>(null)
  const [materiaCounts, setMateriaCounts] = useState<MateriaCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCounts() {
      const [{ count }, counts] = await Promise.all([
        supabase.from("questions").select("*", { count: "exact", head: true }),
        Promise.all(
          MATERIAS.map(async (m) => {
            const { count } = await supabase
              .from("questions")
              .select("*", { count: "exact", head: true })
              .eq("materia", m)
            return { materia: m, count: count ?? 0 }
          })
        ),
      ])
      setTotal(count ?? 0)
      setMateriaCounts(counts)
      setLoading(false)
    }
    loadCounts()
  }, [supabase])

  const irParaResolver = useCallback(
    (extra?: Record<string, string>) => {
      const params = new URLSearchParams()
      if (materia) params.set("materia", materia)
      if (banca) params.set("banca", banca)
      if (ano) params.set("ano", ano)
      if (area) params.set("area", area)
      Object.entries(extra ?? {}).forEach(([k, v]) => params.set(k, v))
      const qs = params.toString()
      router.push(`/questoes/resolver${qs ? `?${qs}` : ""}`)
    },
    [materia, banca, ano, area, router]
  )

  const temFiltro = Boolean(materia || banca || ano || area)

  function limpar() {
    setMateria("")
    setBanca("")
    setAno("")
    setArea("")
  }

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Questões"
        subtitle="Escolha uma matéria para começar ou refine por banca e ano."
        actions={
          <>
            <Button variant="secondary" onClick={() => router.push("/questoes/resolver?aleatorio=true")}>
              <Shuffle size={14} strokeWidth={2} />
              Aleatório
            </Button>
            <Button variant="accent" onClick={() => irParaResolver()}>
              {temFiltro ? "Resolver com filtros" : "Começar"}
            </Button>
          </>
        }
      />

      <Toolbar
        onClear={limpar}
        hasFilters={temFiltro}
        trailing={
          total != null && (
            <span className="text-sm tabular-nums text-fg-subtle">
              {total.toLocaleString("pt-BR")} questões no acervo
            </span>
          )
        }
      >
        <FilterSelect label="Matéria" value={materia} onChange={setMateria} options={[...MATERIAS]} />
        <FilterSelect label="Banca" value={banca} onChange={setBanca} options={[...BANCAS]} />
        <FilterSelect label="Ano" value={ano} onChange={setAno} options={ANOS} />
        <FilterSelect label="Área" value={area} onChange={setArea} options={[...AREAS]} />
      </Toolbar>

      {/* Grade de matérias — o caminho de um clique. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <Panel key={i}>
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="mt-2 h-2.5 w-16" />
              </Panel>
            ))
          : materiaCounts.map((mc) => (
              <button
                key={mc.materia}
                onClick={() => router.push(`/questoes/resolver?materia=${encodeURIComponent(mc.materia)}`)}
                disabled={mc.count === 0}
                className={[
                  "group rounded-lg border border-line bg-surface p-3.5 text-left shadow-xs",
                  "transition-[border-color,background-color,box-shadow] duration-DEFAULT",
                  "hover:border-line-strong hover:bg-surface-hover hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
                  "disabled:pointer-events-none disabled:opacity-45",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium leading-snug text-fg">{mc.materia}</span>
                  <ArrowUpRight
                    size={13}
                    strokeWidth={2}
                    className="mt-0.5 shrink-0 text-fg-faint opacity-0 transition-opacity duration-DEFAULT group-hover:opacity-100"
                  />
                </div>
                <p className="mt-1 text-xs tabular-nums text-fg-subtle">
                  {mc.count === 0
                    ? "sem questões"
                    : `${mc.count.toLocaleString("pt-BR")} ${mc.count === 1 ? "questão" : "questões"}`}
                </p>
              </button>
            ))}
      </div>

      <div className="border-t border-line pt-4">
        <Link
          href="/questoes/historico"
          className="inline-flex items-center gap-1 text-sm text-fg-subtle transition-colors duration-fast hover:text-fg"
        >
          Histórico de respostas
          <ArrowUpRight size={13} strokeWidth={2} />
        </Link>
      </div>
    </div>
  )
}
