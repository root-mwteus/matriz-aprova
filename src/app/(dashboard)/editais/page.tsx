"use client"

import { useEffect, useState } from "react"
import PageHeader from "@/components/PageHeader"
import { createClient } from "@/lib/supabase/client"
import type { Edital } from "@/types"

const areas = ["Todas", "Concursos", "OAB", "Militar", "ENEM"]

const STATUS_LABEL: Record<Edital["status"], string> = {
  aberto: "ABERTO",
  previsto: "PREVISTO",
  encerrado: "ENCERRADO",
}

const STATUS_STYLE: Record<Edital["status"], string> = {
  aberto: "text-accent bg-accent/10 border border-accent/30",
  previsto: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30",
  encerrado: "text-muted bg-[#2A2A2A]/50 border border-[#2A2A2A]",
}

function formatarData(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR")
}

export default function EditaisPage() {
  const [editais, setEditais] = useState<Edital[]>([])
  const [loading, setLoading] = useState(true)
  const [area, setArea] = useState("Todas")

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: editaisData } = await supabase
        .from("editais")
        .select("*")
        .order("data_prova", { ascending: true, nullsFirst: false })

      setEditais(editaisData || [])

      if (user) {
        const { data: perfil } = await supabase.from("profiles").select("area_concurso").eq("id", user.id).single()
        if (perfil?.area_concurso && areas.includes(perfil.area_concurso)) {
          setArea(perfil.area_concurso)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  const editaisFiltrados = area === "Todas" ? editais : editais.filter((e) => e.area_concurso === area)

  return (
    <div className="space-y-8">
      <PageHeader
        badge="EDITAIS"
        title="Acompanhe os concursos"
        subtitle="Monitore editais e datas importantes"
      />

      <div className="flex flex-wrap gap-2">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              area === a
                ? "bg-accent/20 text-accent border-accent/40"
                : "bg-transparent text-muted border-[#2A2A2A] hover:text-foreground"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-muted text-sm">Carregando...</div>
      ) : editaisFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-[#2A2A2A] rounded-card">
          <span className="text-5xl mb-4">📋</span>
          <h2 className="text-lg font-bold text-[#FFFFFF]">Nenhum edital cadastrado</h2>
          <p className="text-sm text-[#666666] mt-2 max-w-md">
            {editais.length === 0
              ? "Em breve novos editais aparecerão aqui."
              : "Nenhum edital encontrado para essa área."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {editaisFiltrados.map((edital) => (
            <div
              key={edital.id}
              className="bg-card border border-[#2A2A2A] rounded-card p-5 space-y-3 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-foreground font-medium text-sm leading-tight">{edital.orgao}</div>
                  {edital.cargo && <div className="text-muted text-xs mt-0.5">{edital.cargo}</div>}
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[edital.status]}`}>
                  {STATUS_LABEL[edital.status]}
                </span>
              </div>

              <div className="space-y-1 text-xs text-muted font-mono">
                {edital.banca && <div>BANCA: {edital.banca}</div>}
                {edital.vagas != null && <div>VAGAS: {edital.vagas}</div>}
                <div>PROVA: {formatarData(edital.data_prova)}</div>
                <div>INSCRIÇÕES ATÉ: {formatarData(edital.data_inscricao_fim)}</div>
              </div>

              {edital.link && (
                <a
                  href={edital.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] text-accent hover:underline font-medium pt-1"
                >
                  VER EDITAL →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
