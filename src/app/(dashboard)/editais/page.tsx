"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Edital } from "@/types"
import { diasAte as diasAteBase } from "@/lib/utils"
import PageHeader from "@/components/PageHeader"
import { Badge, EmptyState, ErrorState, Panel, Segmented, Skeleton } from "@/components/ui"

/**
 * Editais.
 *
 * A ficha era uma pilha de rótulos em caixa alta ("BANCA:", "VAGAS:",
 * "PROVA:") que ocupava mais espaço do que os valores. Virou uma grade de
 * pares rótulo/valor, com os rótulos discretos e os dados em destaque.
 *
 * A data da prova ganhou a contagem de dias restantes — é a informação
 * que motiva a visita à página, e ela não estava em lugar nenhum.
 */

const AREAS = ["Todas", "Concursos", "OAB", "Militar", "ENEM"]

const STATUS: Record<Edital["status"], { label: string; tone: "positive" | "caution" | "neutral" }> = {
  aberto: { label: "Inscrições abertas", tone: "positive" },
  previsto: { label: "Previsto", tone: "caution" },
  encerrado: { label: "Encerrado", tone: "neutral" },
}

function formatarData(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR")
}

function diasAte(iso: string | null) {
  if (!iso) return null
  const dias = diasAteBase(iso)
  return dias >= 0 ? dias : null
}

export default function EditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")
  const [area, setArea] = useState("Todas")

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        const { data: editaisData } = await supabase
          .from("editais")
          .select("*")
          .order("data_prova", { ascending: true, nullsFirst: false })

        setEditais(editaisData || [])

        if (user) {
          const { data: perfil } = await supabase
            .from("profiles")
            .select("area_concurso")
            .eq("id", user.id)
            .single()
          if (perfil?.area_concurso && AREAS.includes(perfil.area_concurso)) {
            setArea(perfil.area_concurso)
          }
        }
      } catch {
        setErro("Não foi possível carregar os editais")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtrados = area === "Todas" ? editais : editais.filter((e) => e.area_concurso === area)

  if (erro) return <ErrorState description={erro} onRetry={() => window.location.reload()} />

  return (
    <div className="animate-rise space-y-6">
      <PageHeader
        title="Editais"
        subtitle="Concursos abertos e previstos, com as datas que importam."
        actions={
          <Segmented
            size="sm"
            value={area}
            onChange={setArea}
            items={AREAS.map((a) => ({ value: a, label: a }))}
          />
        }
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Panel key={i} className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </Panel>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Panel flush>
          <EmptyState
            icon={<ClipboardList size={16} strokeWidth={1.75} />}
            title={editais.length === 0 ? "Nenhum edital cadastrado" : "Nenhum edital nessa área"}
            description={
              editais.length === 0
                ? "Novos editais aparecem aqui assim que forem publicados."
                : "Troque a área acima para ver os demais concursos."
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((edital) => {
            const dias = diasAte(edital.data_prova)
            const status = STATUS[edital.status]

            return (
              <Panel key={edital.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-snug text-fg">{edital.orgao}</h3>
                    {edital.cargo && <p className="mt-0.5 text-sm text-fg-subtle">{edital.cargo}</p>}
                  </div>
                  <Badge tone={status.tone} size="sm" dot className="shrink-0">
                    {status.label}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3">
                  {edital.banca && <Campo termo="Banca" valor={edital.banca} />}
                  {edital.vagas != null && <Campo termo="Vagas" valor={String(edital.vagas)} />}
                  <Campo
                    termo="Prova"
                    valor={formatarData(edital.data_prova)}
                    nota={dias != null ? (dias === 0 ? "é hoje" : `em ${dias} dias`) : undefined}
                  />
                  <Campo termo="Inscrições até" valor={formatarData(edital.data_inscricao_fim)} />
                </dl>

                <div className="flex-1" />

                {edital.link && (
                  <a
                    href={edital.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-ink transition-opacity duration-fast hover:opacity-80"
                  >
                    Ver edital completo
                    <ArrowUpRight size={13} strokeWidth={2} />
                  </a>
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Campo({ termo, valor, nota }: { termo: string; valor: string; nota?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs uppercase tracking-wide text-fg-faint">{termo}</dt>
      <dd className="truncate text-sm tabular-nums text-fg">
        {valor}
        {nota && <span className="ml-1.5 text-xs text-accent-ink">{nota}</span>}
      </dd>
    </div>
  )
}
