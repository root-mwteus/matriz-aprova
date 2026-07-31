import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  console.log("[supabase-debug]", { url, key: key?.slice(0, 8) + "..." })
  return createBrowserClient(url, key)
}
