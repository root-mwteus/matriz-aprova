import type { SupabaseClient } from "@supabase/supabase-js"
import { sendAvisoLogin } from "@/lib/email"
import { createServiceClient } from "@/lib/supabase/service"
import { parseSessionId } from "@/lib/supabase/session"

/**
 * Aviso de novo login por e-mail (Resend) + histórico de acessos da
 * conta (`login_events`, exibido em /seguranca). Chamado nos pontos
 * onde uma sessão nasce: login por senha (/api/auth/sessao) e o
 * callback de Google/e-mail/recuperação. Falha silenciosa — nunca
 * pode travar um login ou redirect por causa do Resend.
 */

export function describeUserAgent(userAgent: string): { navegador: string; sistema: string } {
  const ua = userAgent.toLowerCase()

  let sistema = "Sistema desconhecido"
  if (/windows nt|windows phone/.test(ua)) sistema = "Windows"
  else if (/iphone/.test(ua)) sistema = "iPhone"
  else if (/ipad/.test(ua)) sistema = "iPad"
  else if (/android/.test(ua)) sistema = "Android"
  else if (/mac os x|macintosh/.test(ua)) sistema = "macOS"
  else if (/linux|x11/.test(ua)) sistema = "Linux"

  // Edg/OPR/SamsungBrowser precisam vir antes de Chrome — esses
  // navegadores incluem "Chrome/" no próprio user agent.
  let navegador = "Navegador desconhecido"
  if (/edg\//.test(ua)) navegador = "Edge"
  else if (/opr\/|opera/.test(ua)) navegador = "Opera"
  else if (/samsungbrowser/.test(ua)) navegador = "Samsung Internet"
  else if (/chrome\/|crios\//.test(ua)) navegador = "Chrome"
  else if (/firefox\/|fxios\//.test(ua)) navegador = "Firefox"
  else if (/safari\//.test(ua)) navegador = "Safari"

  return { navegador, sistema }
}

export function ipFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return headers.get("x-real-ip")?.trim() || null
}

export async function notifyLogin({
  nome,
  email,
  headers,
}: {
  nome: string
  email: string
  headers: Headers
}) {
  try {
    const { navegador, sistema } = describeUserAgent(headers.get("user-agent") ?? "")
    const { error } = await sendAvisoLogin({
      nome,
      email,
      navegador,
      sistema,
      ip: ipFromHeaders(headers),
    })
    if (error) console.error("[aviso-login]", error)
  } catch (e) {
    console.error("[aviso-login]", e)
  }
}

/**
 * Registra o acesso em `login_events` (service role — sem policy de
 * INSERT, o cliente não forja histórico). O `session_id` permite marcar
 * na página /seguranca qual entrada é o dispositivo atual.
 */
export async function registrarLoginEvento(
  supabase: SupabaseClient,
  headers: Headers
): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { navegador, sistema } = describeUserAgent(headers.get("user-agent") ?? "")
    await createServiceClient().from("login_events").insert({
      user_id: session.user.id,
      navegador,
      sistema,
      ip: ipFromHeaders(headers),
      session_id: parseSessionId(session.access_token),
    })
  } catch (e) {
    console.error("[login-event]", e)
  }
}
