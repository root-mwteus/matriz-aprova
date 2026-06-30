"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminQuestaoDetailPage() {
  const params = useParams()
  const router = useRouter()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-title uppercase">Detalhes da Questão</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/questoes/${params.id}/editar`}
            className="bg-accent text-accent-foreground font-bold px-5 py-2.5 rounded-card text-sm hover:opacity-90 transition-opacity"
          >
            EDITAR
          </Link>
          <Link
            href="/admin/questoes"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← VOLTAR
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
        <span className="text-5xl mb-4">📝</span>
        <p className="text-sm text-muted">Questão não encontrada</p>
      </div>
    </div>
  )
}
