"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#08090A", color: "#F7F8F9", fontFamily: "sans-serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "28px", margin: 0 }}>Algo deu errado.</h1>
          <p style={{ fontSize: "15px", color: "#9BA3AF", margin: 0, maxWidth: 420 }}>
            O erro foi registrado e nossa equipe já foi avisada. Tente novamente.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#C2F04C",
              color: "#16210A",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  )
}
