"use client"

import { useParams } from "next/navigation"

export default function QuestaoPage() {
  const params = useParams()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-title uppercase">Questão</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">📝</span>
        <p className="text-sm text-muted">Questão não encontrada</p>
      </div>
    </div>
  )
}
