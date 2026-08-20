import { createBrowserClient } from "@supabase/ssr"

const ANON_KEY_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

/**
 * Domínio raiz para os cookies de auth (PKCE code_verifier, session).
 * Em produção, os cookies precisam de `domain: ".matrizaprova.com"` para
 * que o code_verifier guardado em matrizaprova.com/login seja visível em
 * app.matrizaprova.com/auth/callback — senão o OAuth com Google falha
 * (exchangeCodeForSession não acha o verifier e cai em auth_callback_error).
 * Localhost não usa domínio (cookie default do host).
 */
const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? ".matrizaprova.com" : undefined

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida")
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não definida")

  try {
    new URL(url)
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL inválida: "${url}"`)
  }

  if (!ANON_KEY_PATTERN.test(key)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY inválida — confira se a chave foi colada sem quebras de linha ou linhas extras (deve ser um JWT único)"
    )
  }

  return createBrowserClient(url, key, {
    auth: {
      flowType: "pkce",
      cookieOptions: {
        domain: COOKIE_DOMAIN,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  })
}
