"use client"

import { QuestaoForm } from "@/components/admin/QuestaoForm"

export default function NovaQuestaoPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-fg">Nova Questão</h1>
      <QuestaoForm />
    </div>
  )
}
