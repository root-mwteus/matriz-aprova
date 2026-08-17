"use client"

import Link from "next/link"
import { Logo } from "@/components/marketing/Logo"
import { ThemeToggle } from "@/components/marketing/ThemeToggle"

/**
 * Casca das telas de entrada (login, cadastro, recuperação).
 *
 * As três repetiam a mesma marcação: o mesmo container centralizado, o
 * mesmo cabeçalho com a marca, o mesmo painel e o mesmo rodapé — cada
 * uma com pequenas diferenças de espaçamento que não eram intencionais.
 *
 * O painel tem largura fixa de 400px: um formulário de autenticação com
 * campos largos parece pedir mais informação do que pede.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] animate-rise">
        <div className="mb-7 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md transition-opacity duration-fast hover:opacity-80"
          >
            <Logo className="h-7 w-auto" />
          </Link>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-5">
            <h1 className="text-lg font-semibold text-fg">{title}</h1>
            {description && <p className="mt-1 text-base text-fg-muted">{description}</p>}
          </div>

          {children}
        </div>

        {footer && <div className="mt-5 text-center text-base text-fg-muted">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * Erro do servidor.
 *
 * `role="alert"` faz o leitor de tela anunciar a falha assim que ela
 * aparece — sem isso, quem não vê a tela envia o formulário e não recebe
 * retorno nenhum.
 */
export function AuthError({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="rounded-md border border-[color:var(--negative)]/25 bg-negative-soft px-3 py-2 text-sm text-negative"
    >
      {children}
    </p>
  )
}

export function AuthDivider({ label = "ou" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface px-2.5 text-xs text-fg-faint">{label}</span>
      </div>
    </div>
  )
}
