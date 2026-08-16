import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Sessão única por conta.
 *
 * O `session_id` é um claim do access token: estável entre renovações
 * da mesma sessão e novo a cada login — é ele que identifica "qual
 * dispositivo entrou por último" sem precisar rastrear dispositivos.
 */
export function parseSessionId(accessToken: string): string | null {
  const parts = accessToken.split(".")
  if (parts.length !== 3) return null

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.session_id === "string" ? payload.session_id : null
  } catch {
    return null
  }
}

/**
 * true quando a sessão do cookie não é mais a registrada para a conta —
 * ou seja, alguém entrou em outro dispositivo. Falha aberta (false)
 * quando não há sessão legível ou a conta ainda não tem registro:
 * sessões criadas antes da migração não são derrubadas à força.
 */
export async function isSessionRevoked(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return false

  const sessionId = parseSessionId(session.access_token)
  const userId = session.user?.id
  if (!sessionId || !userId) return false

  const { data: registro } = await supabase
    .from("user_sessions")
    .select("session_id")
    .eq("user_id", userId)
    .maybeSingle()

  if (!registro) return false
  return registro.session_id !== sessionId
}
