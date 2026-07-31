import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim()

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não definida")
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não definida")
  new URL(url)

  return createSupabaseClient(url, key, {
    auth: {
      flowType: "pkce",
    },
    global: {
      fetch: (input, init) => {
        const urlStr = String(input)
        console.log("[supabase-fetch]", urlStr)
        try {
          return fetch(input, init)
        } catch (e) {
          console.error("[supabase-fetch-error]", urlStr, e)
          throw e
        }
      },
    },
  })
}
