import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida")
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não definida")
  new URL(url)

  return createBrowserClient(url, key)
}
