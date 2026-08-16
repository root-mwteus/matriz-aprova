import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import { parseSessionId } from "@/lib/supabase/session"

/**
 * Registra a sessão atual (do cookie) como a ativa da conta. Efeito
 * desejado: a sessão anterior, em outro dispositivo, deixa de casar
 * com o registro e é derrubada no próximo check (middleware/APIs).
 *
 * A escrita usa a service role porque o RLS de `user_sessions` só
 * libera leitura ao próprio usuário — sem isso, um cliente poderia
 * regravar o id de uma sessão antiga e burlar o limite de sessões.
 */
export async function registerCurrentSession(supabase: SupabaseClient): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return

  const sessionId = parseSessionId(session.access_token)
  if (!sessionId) return

  const service = createServiceClient()
  await service.from("user_sessions").upsert({
    user_id: session.user.id,
    session_id: sessionId,
    updated_at: new Date().toISOString(),
  })
}
