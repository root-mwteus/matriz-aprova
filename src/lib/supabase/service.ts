import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente com a chave service_role — usado APENAS no servidor.
 * Ignora RLS para ler dados de qualquer usuário. Nunca exponha a
 * chave ao cliente; essas chamadas só existem atrás de rotas /api
 * que autenticam o usuário (e checam role quando necessário).
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}
