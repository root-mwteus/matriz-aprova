"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Question } from "@/types"

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

    return () => {
      active = false
    }
  }, [params.id])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-title uppercase">Detalhes da Questão</h1>
        </div>
        <div className="flex items-center gap-3">
          {questao && (
            <Link
              href={`/admin/questoes/${params.id}/editar`}
              className="bg-accent text-accent-foreground font-bold px-5 py-2.5 rounded-card text-sm hover:opacity-90 transition-opacity"
            >
              EDITAR
            </Link>
          )}
          <Link
            href="/admin/questoes"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
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
        <div className="bg-CARD border border-[#2A2A2A] rounded-card p-6 space-y-6">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-accent/10 text-accent px-2.5 py-1 rounded-full">{questao.materia}</span>
            {questao.sub_materia && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.sub_materia}</span>}
            {questao.banca && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.banca}</span>}
            {questao.ano && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.ano}</span>}
            {questao.area_concurso && <span className="bg-white/5 text-muted px-2.5 py-1 rounded-full">{questao.area_concurso}</span>}
          </div>

          <p className="text-foreground text-sm leading-relaxed">{questao.enunciado}</p>

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
                <span className="text-sm text-foreground pt-1">{alt.text}</span>
              </div>
            ))}
          </div>

          {questao.explicacao && (
            <div>
              <div className="text-[11px] text-muted font-mono mb-2">/ EXPLICAÇÃO</div>
              <p className="text-sm text-muted leading-relaxed">{questao.explicacao}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
