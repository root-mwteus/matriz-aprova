"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { BookOpen, Download, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { BANCAS, MATERIAS } from "@/lib/constants"
import type { Material } from "@/types"
import PageHeader from "@/components/PageHeader"
import {
  Badge,
  Button,
  EmptyState,
  FilterSelect,
  IconButton,
  Panel,
  Segmented,
  Skeleton,
  Toolbar,
} from "@/components/ui"

/**
 * Biblioteca de materiais.
 *
 * A lista virou grade de fichas de altura uniforme: título, contexto e
 * ação sempre nas mesmas coordenadas, o que permite comparar itens em
 * varredura vertical sem reler a estrutura de cada um.
 *
 * O par de botões "Todos / Sugeridos pela IA" era duas ações que pareciam
 * dois estados; virou um controle segmentado, que mostra a opção
 * escolhida e a alternativa lado a lado.
 */

type Ordenacao = "incidencia" | "materia" | "recentes"
type FiltroIA = "todos" | "ia"

export default function MateriaisPage() {
  const supabase = createClient()
  const [materiais, setMateriais] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [materia, setMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [professor, setProfessor] = useState("")
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("incidencia")
  const [filtroIA, setFiltroIA] = useState<FiltroIA>("todos")
  const [professores, setProfessores] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase.from("materials").select("*")

      if (materia) query = query.eq("materia", materia)
      if (banca) query = query.eq("banca", banca)
      if (professor) query = query.ilike("professor", `%${professor}%`)
      if (filtroIA === "ia") query = query.gt("incidencia_pct", 70)

      if (ordenacao === "incidencia")
        query = query.order("incidencia_pct", { ascending: false, nullsFirst: false })
      else if (ordenacao === "materia") query = query.order("materia", { ascending: true })
      else query = query.order("created_at", { ascending: false })

      const { data } = await query
      if (data) {
        setMateriais(data)
        // A lista de professores vinha do resultado já filtrado: escolher
        // um professor apagava os demais do próprio filtro. Só cresce.
        setProfessores((atuais) => {
          const nomes = new Set([...atuais, ...data.map((m) => m.professor).filter(Boolean)])
          return Array.from(nomes).sort() as string[]
        })
      }
      setLoading(false)
    }
    load()
  }, [supabase, materia, banca, professor, ordenacao, filtroIA])

  const handleDownload = useCallback(async (url: string | null, titulo: string) => {
    if (!url) return
    const supabase = createClient()
    const { data, error } = await supabase.storage.from("materiais").createSignedUrl(url, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank")
    } else {
      console.error("Erro ao gerar URL do material:", error)
      toast.error(`Não foi possível abrir "${titulo}"`)
    }
  }, [])

  const temFiltro = Boolean(materia || banca || professor)

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Materiais"
        subtitle="PDFs ordenados pela incidência nas provas da sua banca."
      />

      <div className="space-y-3">
        <Toolbar
          onClear={() => {
            setMateria("")
            setBanca("")
            setProfessor("")
          }}
          hasFilters={temFiltro}
          trailing={
            <Segmented
              size="sm"
              value={ordenacao}
              onChange={(v) => setOrdenacao(v as Ordenacao)}
              items={[
                { value: "incidencia", label: "Incidência" },
                { value: "materia", label: "Matéria" },
                { value: "recentes", label: "Recentes" },
              ]}
            />
          }
        >
          <FilterSelect label="Matéria" value={materia} onChange={setMateria} options={[...MATERIAS]} />
          <FilterSelect label="Banca" value={banca} onChange={setBanca} options={[...BANCAS]} />
          <FilterSelect label="Professor" value={professor} onChange={setProfessor} options={professores} />
        </Toolbar>

        <div className="flex items-center gap-3">
          <Segmented
            size="sm"
            value={filtroIA}
            onChange={(v) => setFiltroIA(v as FiltroIA)}
            items={[
              { value: "todos", label: "Todos" },
              { value: "ia", label: "Alta incidência" },
            ]}
          />
          <span className="text-xs text-fg-faint">
            {filtroIA === "ia"
              ? "Apenas materiais com incidência acima de 70%"
              : `${materiais.length} ${materiais.length === 1 ? "material" : "materiais"}`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Panel key={i} className="space-y-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </Panel>
          ))}
        </div>
      ) : materiais.length === 0 ? (
        <Panel flush>
          <EmptyState
            icon={<BookOpen size={16} strokeWidth={1.75} />}
            title="Nenhum material encontrado"
            description="Nenhum PDF corresponde a esses filtros. Tente ampliar a busca."
            action={
              temFiltro ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setMateria("")
                    setBanca("")
                    setProfessor("")
                  }}
                >
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiais.map((m) => (
            <Panel key={m.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold leading-snug text-fg">{m.titulo}</h3>
                {(m.incidencia_pct ?? 0) > 70 && (
                  <Badge tone="accent" size="sm" className="mt-0.5 shrink-0">
                    {m.incidencia_pct}%
                  </Badge>
                )}
              </div>

              <p className="mt-1.5 text-sm text-fg-subtle">
                {[m.materia, m.banca].filter(Boolean).join(" · ") || "Sem classificação"}
              </p>

              <div className="flex-1" />

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-fg-faint">
                  <FileText size={12} strokeWidth={1.75} />
                  {m.paginas ? `${m.paginas} pág.` : "PDF"}
                  {m.professor ? ` · ${m.professor}` : ""}
                </span>
                <IconButton
                  label={`Baixar ${m.titulo}`}
                  variant="ghost"
                  size="sm"
                  disabled={!m.pdf_url}
                  onClick={() => handleDownload(m.pdf_url, m.titulo)}
                >
                  <Download size={14} strokeWidth={1.75} />
                </IconButton>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
