"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, FileQuestion } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"
import { cn } from "@/lib/utils"
import { Badge, Button, EmptyState, Panel, Skeleton } from "@/components/ui"

/**
 * Questão avulsa.
 *
 * Era um esqueleto: lia o `id` da rota e nunca o usava, mostrando
 * "Questão não encontrada" em qualquer situação. Como a rota já existia
 * e podia estar em links salvos, foi implementada em vez de removida.
 *
 * Diferente de /questoes/resolver, aqui o gabarito já vem aberto — este
 * endereço serve para consultar e revisar uma questão específica, não
 * para respondê-la.
 */

const LETRAS = ["A", "B", "C", "D", "E"]

export default function QuestaoPage() {
  const params = useParams()
  const router = useRouter()
  const [questao, setQuestao] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("questions").select("*").eq("id", params.id).single()
      setQuestao(data)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="mx-auto max-w-[680px]">
        <Panel className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </Panel>
      </div>
    )
  }

  if (!questao) {
    return (
      <Panel flush className="mx-auto max-w-[560px]">
        <EmptyState
          icon={<FileQuestion size={16} strokeWidth={1.75} />}
          title="Questão não encontrada"
          description="Ela pode ter sido removida do acervo."
          action={
            <Button variant="accent" onClick={() => router.push("/questoes")}>
              Ver questões
            </Button>
          }
        />
      </Panel>
    )
  }

  return (
    <div className="mx-auto max-w-[680px] animate-rise space-y-4">
      <Panel flush>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-5 py-3">
          <Badge size="sm">{questao.materia}</Badge>
          {questao.banca && <Badge size="sm">{questao.banca}</Badge>}
          {questao.ano && <Badge size="sm">{questao.ano}</Badge>}
          {questao.nivel && (
            <Badge size="sm" className="capitalize">
              {questao.nivel}
            </Badge>
          )}
        </div>

        {questao.mostrar_texto && questao.texto_referencia && (
          <div className="border-b border-line bg-surface-sunken px-5 py-4">
            <p className="mb-2 text-2xs font-medium uppercase tracking-wide text-fg-faint">
              Texto de apoio
            </p>
            <LatexText
              text={questao.texto_referencia}
              block
              className="text-base leading-relaxed text-fg-muted"
            />
          </div>
        )}

        <div className="px-5 py-5">
          {questao.figuras?.length > 0 && (
            <div className="mb-4 space-y-3">
              {(questao.figuras as QuestaoFigura[]).map((fig) => {
                const supabase = createClient()
                const { data } = supabase.storage
                  .from("questoes-figuras")
                  .getPublicUrl(fig.storage_path)
                return (
                  <figure key={fig.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.publicUrl}
                      alt={fig.legenda || "Figura da questão"}
                      className="max-w-full rounded-md border border-line"
                    />
                    {fig.legenda && (
                      <figcaption className="mt-1.5 text-center text-xs text-fg-subtle">
                        {fig.legenda}
                      </figcaption>
                    )}
                  </figure>
                )
              })}
            </div>
          )}

          <LatexText text={questao.enunciado} block className="text-base leading-relaxed text-fg" />
        </div>

        <ul className="space-y-1.5 px-5 pb-5">
          {questao.alternativas.map((alt, i) => {
            const correta = i === questao.resposta_correta
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3.5 py-3",
                  correta
                    ? "border-[color:var(--positive)] bg-positive-soft"
                    : "border-line opacity-70"
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border text-xs font-medium",
                    correta
                      ? "border-[color:var(--positive)] text-positive"
                      : "border-line-strong text-fg-subtle"
                  )}
                >
                  {LETRAS[i]}
                </span>
                <LatexText
                  text={alt.text || ""}
                  className="flex-1 text-base leading-relaxed text-fg"
                />
                {correta && (
                  <>
                    <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-positive" />
                    <span className="sr-only">Alternativa correta</span>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>

      {questao.explicacao && (
        <Panel>
          <h2 className="text-sm font-semibold text-fg">Explicação</h2>
          <LatexText
            text={questao.explicacao}
            block
            className="mt-2 text-base leading-relaxed text-fg-muted"
          />
          {questao.referencias && (
            <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-fg-subtle">
              {questao.referencias}
            </p>
          )}
        </Panel>
      )}

      <div className="flex justify-end">
        <Button variant="accent" onClick={() => router.push("/questoes/resolver")}>
          Praticar questões
        </Button>
      </div>
    </div>
  )
}
