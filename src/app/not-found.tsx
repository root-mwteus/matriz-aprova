import Link from "next/link"
import type { Metadata } from "next"
import { ThemeToggle } from "@/components/marketing/ThemeToggle"

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
}

/**
 * 404.
 *
 * Antes o "404" gigante em lime era o elemento mais destacado da tela —
 * o código do erro é a informação menos útil para quem se perdeu. Agora
 * ele é a nota de rodapé, e o espaço vai para as duas saídas: voltar ao
 * site ou ir direto ao painel.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-medium tabular-nums text-fg-faint">404</p>

        <h1 className="mt-3 text-2xl font-semibold text-fg">Página não encontrada</h1>

        <p className="mt-2 text-base text-fg-muted">
          O endereço não existe ou o conteúdo foi movido.
        </p>

        <div className="mt-7 flex items-center justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-[34px] items-center rounded-md bg-solid px-3.5 text-sm font-medium text-fg-on-solid shadow-xs transition-colors duration-fast hover:bg-solid-hover"
          >
            Voltar ao início
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-[34px] items-center rounded-md border border-line-strong bg-surface px-3.5 text-sm font-medium text-fg shadow-xs transition-colors duration-fast hover:bg-surface-hover"
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    </div>
  )
}
