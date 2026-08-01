import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

/**
 * Acesso administrativo aos dados.
 *
 * As policies RLS das tabelas de dados do aluno (`user_answers`,
 * `study_plans`, `simulations`, `progress`) não dão SELECT para o admin —
 * com a chave anônima, o dashboard veria só as linhas do próprio admin.
 * Por isso as páginas /admin consomem estas rotas, que autenticam o
 * usuário, conferem role = 'admin' e passam a usar a chave service_role
 * (nunca exposta ao cliente) para enxergar os dados de todos.
 */

export type AdminSupabase = SupabaseClient

export async function requireAdmin(): Promise<AdminSupabase | null> {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (perfil?.role !== "admin") return null

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
