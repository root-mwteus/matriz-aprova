"use client"

import { ReactNode } from "react"

interface MetricCardProps {
  label: string
  value: string | number
  variacao?: string
  variacaoPositiva?: boolean
  children?: ReactNode
}

export function MetricCard({ label, value, variacao, variacaoPositiva = true, children }: MetricCardProps) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-5 relative overflow-hidden">
      <div className="text-[11px] text-muted font-mono mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {variacao && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${variacaoPositiva ? "text-accent" : "text-red-400"}`}>
          <span>{variacaoPositiva ? "↑" : "↓"}</span>
          {variacao}
        </div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
