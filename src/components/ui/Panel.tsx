"use client"

import { cn } from "@/lib/utils"

/**
 * Painel — a única superfície de agrupamento da aplicação.
 *
 * Substitui a coleção de "cards" que existia antes. Um painel não é
 * decorativo: ele sinaliza que o conteúdo interno pertence a um mesmo
 * assunto. Quando não há agrupamento a comunicar, o conteúdo vai direto
 * sobre o canvas — é isso que produz o respiro da interface.
 */

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove o padding interno — necessário quando o filho é tabela ou lista. */
  flush?: boolean
  /** Painel clicável: ganha reação a hover e cursor. */
  interactive?: boolean
  as?: "div" | "section" | "article"
}

export function Panel({ flush, interactive, as: Tag = "div", className, children, ...props }: PanelProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg border border-line bg-surface shadow-xs",
        !flush && "p-4",
        interactive &&
          "cursor-pointer transition-[border-color,box-shadow,background-color] duration-DEFAULT " +
            "hover:border-line-strong hover:bg-surface-hover hover:shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

/**
 * Cabeçalho de painel. Título à esquerda, ações à direita — sempre.
 * A previsibilidade dessa posição é o que permite varrer a tela rápido.
 */
export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-line px-4 py-3",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 truncate text-xs text-fg-subtle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}

export function PanelBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {children}
    </div>
  )
}

export function PanelFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-line bg-surface-sunken/60 px-4 py-2.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Seção de página — agrupa conteúdo sem desenhar uma caixa.
 * Preferir a Panel sempre que a borda não acrescentar informação.
 */
export function Section({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || actions) && (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={cn(vertical ? "h-full w-px" : "h-px w-full", "shrink-0 bg-line", className)}
    />
  )
}
