"use client"

import { Suspense } from "react"
import { ResolverContent } from "./content"

export default function ResolverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-muted text-sm animate-pulse">Carregando questões...</div>
        </div>
      }
    >
      <ResolverContent />
    </Suspense>
  )
}
