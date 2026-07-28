"use client"

import "./globals.css"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {

  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased">
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-2xl font-semibold text-fg">Algo deu errado</h1>

            <p className="mt-2 text-base text-fg-muted">
              O erro foi registrado e nossa equipe já foi avisada. Tente novamente.
            </p>

            <div className="mt-7 flex items-center justify-center gap-2">
              <button
                onClick={reset}
                className="inline-flex h-[34px] items-center rounded-md bg-solid px-3.5 text-sm font-medium text-fg-on-solid shadow-xs transition-colors duration-fast hover:bg-solid-hover"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="inline-flex h-[34px] items-center rounded-md border border-line-strong bg-surface px-3.5 text-sm font-medium text-fg shadow-xs transition-colors duration-fast hover:bg-surface-hover"
              >
                Voltar ao início
              </a>
            </div>

            {/* O código identifica esta ocorrência no Sentry — é o que o
                suporte precisa pedir a quem relata o problema. */}
            {error.digest && (
              <p className="mt-6 font-mono text-xs text-fg-faint">Código: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
