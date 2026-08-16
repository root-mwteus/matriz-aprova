import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { isSessionRevoked } from "@/lib/supabase/session"

export interface SessionUser {
  user: User
  role: string | null
  suspenso: boolean
}

/**
 * Usuário da sessão + perfil (role, suspenso) numa única ida ao banco.
 * A suspensão é aplicada no middleware para páginas, mas as rotas /api
 * precisam checá-la por conta própria — o middleware não alcança os
 * helpers internos e um JWT válido continuaria valendo nas APIs. O
 * mesmo vale para a sessão única: token de um dispositivo substituído
 * segue válido até expirar, então a checagem é feita aqui também.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase.from("profiles").select("role, suspenso").eq("id", user.id).single()

  if (perfil?.suspenso) {
    return { user, role: perfil?.role ?? null, suspenso: true }
  }

  if (await isSessionRevoked(supabase)) return null

  return { user, role: perfil?.role ?? null, suspenso: perfil?.suspenso ?? false }
}

/** Usuário logado e NÃO suspenso — ou null (401). */
export async function requireUser(): Promise<User | null> {
  const session = await getSessionUser()
  if (!session || session.suspenso) return null
  return session.user
}
