"use client"

import PageHeader from "@/components/PageHeader"

export default function EstatisticasPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        badge="ESTATÍSTICAS"
        title="Sua evolução detalhada"
        subtitle="Acompanhe seu desempenho em todas as matérias"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666] mb-4">
            DESEMPENHO POR MATÉRIA
          </h2>
          <div className="flex items-center justify-center h-48 text-[#666666] text-sm">
            Resolva questões para gerar gráficos
          </div>
        </div>

        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666] mb-4">
            EVOLUÇÃO SEMANAL
          </h2>
          <div className="flex items-center justify-center h-48 text-[#666666] text-sm">
            Resolva questões para gerar gráficos
          </div>
        </div>

        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666] mb-4">
            TAXA DE ACERTO
          </h2>
          <div className="flex items-center justify-center h-48 text-[#666666] text-sm">
            Resolva questões para gerar gráficos
          </div>
        </div>

        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666666] mb-4">
            TEMPO MÉDIO
          </h2>
          <div className="flex items-center justify-center h-48 text-[#666666] text-sm">
            Resolva questões para gerar gráficos
          </div>
        </div>
      </div>
    </div>
  )
}
