"use client"

import { ReactNode } from "react"
import { Panel, Stat } from "@/components/ui"

/**
 * Cartão de métrica do admin — fachada sobre Panel + Stat.
 *
 * A variação chegava como texto ("12%") e um booleano separado dizendo
 * se era alta ou baixa: dois campos para um dado só, fáceis de deixar
 * inconsistentes. Continuam aceitos, mas são convertidos num número com
 * sinal, que é o que o componente de estatística entende.
 */

interface MetricCardProps {
  label: string
  value: string | number
  variacao?: string
  variacaoPositiva?: boolean
  children?: ReactNode
}

export function MetricCard({ label, value, variacao, variacaoPositiva = true, children }: MetricCardProps) {
  const parsed = variacao ? Number(variacao.replace(/[^\d.,-]/g, "").replace(",", ".")) : null
  const delta = parsed != null && !Number.isNaN(parsed) ? (variacaoPositiva ? parsed : -parsed) : null

  return (
    <Panel>
      <Stat
        label={label}
        value={value}
        delta={delta}
        deltaLabel={delta != null ? "vs. mês anterior" : undefined}
      />
      {children && <div className="mt-3">{children}</div>}
    </Panel>
  )
}
