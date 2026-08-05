"use client"

import { QuestaoForm } from "@/components/admin/QuestaoForm"

export default function EditarQuestaoPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-fg">Editar Questão</h1>
      <QuestaoForm questionId={params.id} />
    </div>
  )
}
