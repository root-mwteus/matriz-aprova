"use client"

import PageHeader from "@/components/PageHeader"

export default function EditaisPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        badge="EDITAIS"
        title="Acompanhe os concursos"
        subtitle="Monitore editais e datas importantes"
      />

      <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-[14px]">
        <span className="text-5xl mb-4">📋</span>
        <h2 className="text-lg font-bold text-[#FFFFFF]">Nenhum edital cadastrado</h2>
        <p className="text-sm text-[#666666] mt-2 max-w-md">
          Adicione editais para criar um plano de estudos personalizado.
        </p>
      </div>
    </div>
  )
}
