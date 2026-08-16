import { sendAvisoLogin } from "@/lib/email"

/**
 * Aviso de novo login por e-mail (Resend). Chamado nos pontos onde uma
 * sessão nasce: login por senha (/api/auth/sessao) e o callback de
 * Google/e-mail/recuperação. Falha silenciosa — nunca pode travar um
 * login ou redirect por causa do Resend.
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
