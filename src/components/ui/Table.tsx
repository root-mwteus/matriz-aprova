"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton, EmptyState } from "./Feedback"
import { IconButton } from "./Button"

/**
 * Tabela de dados.
 *
 * Decisões que sustentam a legibilidade em listas longas:
 * · cabeçalho grudado no topo ao rolar;
 * · sem zebra — linhas alternadas viram ruído; o hairline basta;
 * · números e datas alinhados à direita e tabulares, para comparar
 *   grandezas na vertical sem ler dígito a dígito;
 * · skeleton com o mesmo número de linhas do resultado, para a lista
 *   não "pular" quando os dados chegam.
 */

export interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => React.ReactNode
  /** Alinha a coluna à direita e ativa numerais tabulares. */
  numeric?: boolean
  width?: string
  className?: string
  /** Esconde a coluna abaixo de md — para metadados secundários. */
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRowClick?: (row: T) => void
  getRowId?: (row: T, index: number) => string | number
  /* Paginação — omitir `total` desliga o rodapé. */
  page?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  emptyAction,
  onRowClick,
  getRowId,
  page = 1,
  total,
  pageSize = 10,
  onPageChange,
  className,
}: DataTableProps<T>) {
  const showPagination = total != null && total > pageSize && onPageChange

  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-surface shadow-xs", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={cn(
                    "sticky top-0 z-10 bg-surface px-3 py-2.5 text-xs font-medium text-fg-subtle",
                    col.numeric ? "text-right" : "text-left",
                    col.hideOnMobile && "hidden md:table-cell",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {columns.map((col, ci) => (
                    <td
                      key={col.key}
                      className={cn("px-3 py-2.5", col.hideOnMobile && "hidden md:table-cell")}
                    >
                      <Skeleton
                        className="h-3.5"
                        style={{ width: col.numeric ? "48px" : `${[82, 64, 74, 56][ci % 4]}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={getRowId?.(row, idx) ?? row.id ?? idx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter") onRowClick(row)
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-line transition-colors duration-fast last:border-0",
                    onRowClick && "cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-3 py-2.5 text-fg-muted",
                        col.numeric && "text-right tabular-nums",
                        col.hideOnMobile && "hidden md:table-cell",
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <Pagination
          page={page}
          total={total!}
          pageSize={pageSize}
          onPageChange={onPageChange!}
          className="border-t border-line px-3 py-2"
        />
      )}
    </div>
  )
}

/**
 * Paginação. O texto informa a posição no conjunto ("21–40 de 137") —
 * mais útil que o número da página isolado, que não diz quanto falta.
 */
export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  className,
}: {
  page: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-xs tabular-nums text-fg-subtle">
        {from}–{to} <span className="text-fg-faint">de</span> {total}
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          label="Página anterior"
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} strokeWidth={2} />
        </IconButton>
        <span className="px-1.5 text-xs tabular-nums text-fg-subtle">
          {page} / {totalPages}
        </span>
        <IconButton
          label="Próxima página"
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={15} strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  )
}
