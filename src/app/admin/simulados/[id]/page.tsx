"use client"

import { useParams } from "next/navigation"
import Link from "next/link"

export default function AdminSimuladoDetailPage() {
  const params = useParams()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-title uppercase">Detalhes do Simulado</h1>
        </div>
        <Link
          href="/admin/simulados"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← VOLTAR
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
        <span className="text-5xl mb-4">🎯</span>
        <p className="text-sm text-muted">Simulado não encontrado</p>
      </div>
    </div>
  )
}
