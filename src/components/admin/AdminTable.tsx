"use client"

import { ReactNode } from "react"

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  page?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-CARD] rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function AdminTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  page = 1,
  total = 0,
  pageSize = 10,
  onPageChange,
}: AdminTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              {columns.map((col) => (
                <th key={col.key} className={`text-left text-[11px] text-muted font-mono font-normal uppercase px-4 py-3 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted text-sm">
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id || idx} className="border-b border-[#2A2A2A] hover:bg-white/[.03] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ""}`}>
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between pt-4 px-4">
          <span className="text-xs text-muted font-mono">
            Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} de {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ANTERIOR
            </button>
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              PRÓXIMO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
