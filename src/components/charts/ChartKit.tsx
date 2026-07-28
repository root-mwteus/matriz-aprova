"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Camada compartilhada dos gráficos.
 *
 * Antes cada gráfico repetia os mesmos hexadecimais nos eixos, na grade e
 * nas barras. Aqui os valores vêm dos tokens, então gráfico e interface
 * mudam juntos — e o tom das marcas é o validado para superfície escura,
 * não o acento da interface (que é claro demais para esse papel).
 */

/**
 * Recharts precisa de cores resolvidas; `var(--x)` não funciona em
 * atributos SVG de preenchimento. Lemos os tokens do documento uma vez.
 */
export function useChartTheme() {
  const [theme, setTheme] = useState({
    series: ["#6FA82C", "#3E7FD4", "#C98A22", "#9E6FD6"],
    grid: "#1E2225",
    axis: "#5A6169",
    track: "#16191C",
  })

  useEffect(() => {
    const s = getComputedStyle(document.documentElement)
    const read = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback
    setTheme({
      series: [
        read("--chart-1", "#6FA82C"),
        read("--chart-2", "#3E7FD4"),
        read("--chart-3", "#C98A22"),
        read("--chart-4", "#9E6FD6"),
      ],
      grid: read("--chart-grid", "#1E2225"),
      axis: read("--chart-axis", "#5A6169"),
      track: read("--chart-track", "#16191C"),
    })
  }, [])

  return theme
}

/** Eixos discretos: sem linha de eixo, sem tique, rótulo pequeno. */
export const axisProps = (color: string) => ({
  stroke: color,
  tick: { fill: color, fontSize: 11 },
  axisLine: false,
  tickLine: false,
})

/**
 * Tooltip. Mesma superfície, borda e sombra dos menus — um balão com
 * estilo próprio faz o gráfico parecer colado de outro produto.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]

  return (
    <div className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 shadow-md">
      <p className="text-xs text-fg-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-fg">
        <span
          aria-hidden
          className="mr-1.5 inline-block h-2 w-2 rounded-[2px] align-middle"
          style={{ background: item.color || item.fill }}
        />
        {formatter ? formatter(item.value) : item.value}
        {item.unit ?? ""}
      </p>
    </div>
  )
}

/**
 * Moldura de gráfico: título, estados e — importante — a alternativa em
 * tabela. Quem usa leitor de tela não lê um SVG de barras; a tabela leva
 * o mesmo dado em texto.
 */
export function ChartFrame({
  title,
  description,
  hasData,
  loading,
  emptyMessage = "Resolva questões para gerar este gráfico",
  tableData,
  height = 200,
  children,
  className,
}: {
  title: string
  description?: string
  hasData: boolean
  loading?: boolean
  emptyMessage?: string
  /** Pares rótulo/valor equivalentes ao gráfico, para leitura assistiva. */
  tableData?: { label: string; value: string }[]
  height?: number
  children: React.ReactNode
  className?: string
}) {
  const [showTable, setShowTable] = useState(false)

  return (
    <section className={cn("rounded-lg border border-line bg-surface p-4 shadow-xs", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-fg-subtle">{description}</p>}
        </div>
        {tableData && hasData && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-fg-subtle transition-colors duration-fast hover:bg-surface-hover hover:text-fg"
          >
            {showTable ? "Ver gráfico" : "Ver tabela"}
          </button>
        )}
      </div>

      <div className="mt-4" style={{ minHeight: height }}>
        {loading ? (
          <div className="skeleton h-full w-full rounded-md" style={{ height }} />
        ) : !hasData ? (
          <p
            className="flex items-center justify-center text-center text-sm text-fg-subtle"
            style={{ height }}
          >
            {emptyMessage}
          </p>
        ) : showTable && tableData ? (
          <div className="overflow-auto" style={{ maxHeight: height }}>
            <table className="w-full text-sm">
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-3 text-fg-muted">{row.label}</td>
                    <td className="py-1.5 text-right font-medium tabular-nums text-fg">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
