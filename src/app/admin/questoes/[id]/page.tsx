"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { LatexText } from "@/components/LatexText"
import type { Question, QuestaoFigura } from "@/types"

function FiguraImg({ figura }: { figura: QuestaoFigura }) {
  const supabase = createClient()
  const { data } = supabase.storage
    .from("questoes-figuras")
    .getPublicUrl(figura.storage_path)

  return (
    <figure className="my-2">
      <img
        src={data.publicUrl}
        alt={figura.legenda || "Figura da questão"}
        className="max-w-full rounded-lg border border-[#2A2A2A]"
      />
      {figura.legenda && (
        <figcaption className="text-[11px] text-muted text-center mt-1">{figura.legenda}</figcaption>
      )}
    </figure>
  )
}

export default function AdminQuestaoDetailPage() {
  const params = useParams<{ id: string }>()
  const [questao, setQuestao] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase
      .from("questions")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error("Erro ao carregar questão:", error)
        setQuestao(data)
        setLoading(false)
      })

    return () => { active = false }
  }, [params.id])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-title uppercase">Detalhes da Questão</h1>
        <div className="flex items-center gap-3">
          {questao && (
            <Link
              href={`/admin/questoes/${params.id}/editar`}
              className="bg-accent text-accent-foreground font-bold px-5 py-2.5 rounded-card text-sm hover:opacity-90 transition-opacity"
            >
              EDITAR
            </Link>
          )}
          <Link href="/admin/questoes" className="text-sm text-muted hover:text-foreground transition-colors">
            ← VOLTAR
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-muted text-sm">Carregando...</div>
      ) : !questao ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">📝</span>
          <p className="text-sm text-muted">Questão não encontrada</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Metadados */}
          <div className="bg-card border border-[#2A2A2A] rounded-card p-6 space-y-5">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-accent/10 text-accent px-2.5 py-1 rounded-full">{questao.materia}</span>
              {questao.sub_materia && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.sub_materia}</span>}
              {questao.banca && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.banca}</span>}
              {questao.ano && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.ano}</span>}
              {questao.area_concurso && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.area_concurso}</span>}
              {questao.nivel && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full uppercase">{questao.nivel}</span>}
              {questao.incidencia_pct != null && (
                <span className="bg-yellow-400/10 text-yellow-400 px-2.5 py-1 rounded-full">
                  {questao.incidencia_pct}% incidência
                </span>
              )}
            </div>

            {/* Texto de referência */}
            {questao.texto_referencia && (
              <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-muted font-mono uppercase tracking-widest">Texto de apoio</div>
                  {!questao.mostrar_texto && (
                    <span className="text-[10px] text-muted">👁 oculto para o aluno</span>
                  )}
                </div>
                <LatexText text={questao.texto_referencia} block className="text-sm text-foreground/80 leading-relaxed" />
              </div>
            )}

            {/* Figuras do enunciado */}
            {questao.figuras?.length > 0 && (
              <div className="space-y-2">
                {questao.figuras.map((fig) => (
                  <FiguraImg key={fig.id} figura={fig} />
                ))}
              </div>
            )}

            {/* Enunciado */}
            <LatexText text={questao.enunciado} block className="text-foreground text-sm leading-relaxed" />

            {/* Alternativas */}
            <div className="space-y-2">
              {questao.alternativas.map((alt, i) => (
                <div
                  key={alt.letter}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    i === questao.resposta_correta ? "border-accent bg-accent/5" : "border-[#2A2A2A]"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                      i === questao.resposta_correta ? "bg-accent text-black" : "bg-[#0D0D0D] text-muted border border-[#2A2A2A]"
                    }`}
                  >
                    {alt.letter}
                  </span>
                  <LatexText text={alt.text} className="text-sm text-foreground pt-1 flex-1" />
                  {i === questao.resposta_correta && (
                    <span className="text-[11px] text-accent font-semibold flex-shrink-0 pt-1">✓ CORRETA</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gabarito comentado */}
          {(questao.explicacao || questao.referencias) && (
            <div className="bg-accent/5 border border-accent/20 rounded-card p-6 space-y-4">
              <div className="text-[11px] text-accent font-mono">/ GABARITO COMENTADO</div>

              {questao.explicacao && (
                <LatexText
                  text={questao.explicacao}
                  block
                  className="text-sm text-foreground/90 leading-relaxed"
                />
              )}

              {questao.referencias && (
                <div className="pt-3 border-t border-accent/20">
                  <div className="text-[11px] text-muted font-mono mb-1.5">REFERÊNCIAS</div>
                  <p className="text-xs text-muted leading-relaxed whitespace-pre-line">{questao.referencias}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
