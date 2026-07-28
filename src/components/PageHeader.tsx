import { cn } from "@/lib/utils"

/**
 * Cabeçalho de página.
 *
 * O "badge" da versão anterior repetia o nome da seção que já aparece na
 * sidebar e na trilha — três vezes a mesma palavra na mesma tela. Saiu.
 * A prop continua aceita para não quebrar chamadas antigas, mas é
 * ignorada; o lugar dessa informação é a trilha de navegação.
 *
 * A ação principal fica na mesma linha do título, alinhada à direita:
 * é o padrão que a pessoa aprende uma vez e reencontra em toda tela.
 */

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** @deprecated A seção já é indicada pela trilha de navegação. */
  badge?: string
  actions?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-fg">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-base text-fg-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
