import { type SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import { getSessionUser } from "@/lib/supabase/auth"

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

export async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.suspenso || session.role !== "admin") return null

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null

  return createServiceClient()
}
