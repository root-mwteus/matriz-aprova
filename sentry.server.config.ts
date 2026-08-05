import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    // Ajustável no painel do Sentry; aqui ~10% das transações.
    tracesSampleRate: 0.1,
    debug: false,
  })
}
