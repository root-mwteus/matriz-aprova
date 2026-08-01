import { createBrowserClient } from "@supabase/ssr"

const ANON_KEY_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

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

  return createBrowserClient(url, key)
}
