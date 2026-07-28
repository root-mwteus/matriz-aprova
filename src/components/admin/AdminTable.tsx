"use client"

import { DataTable, type Column } from "@/components/ui"

/**
 * Mantida como fachada da DataTable do sistema.
 *
 * O admin tinha a própria tabela — com outra paginação, outro skeleton e
 * outro estado vazio. Agora é a mesma tabela da aplicação; este arquivo
 * existe só para não reescrever as chamadas nas páginas do admin.
 */

export type { Column }

export function AdminTable<T extends Record<string, any>>(props: {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  page?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onRowClick?: (row: T) => void
}) {
  return <DataTable {...props} />
}
