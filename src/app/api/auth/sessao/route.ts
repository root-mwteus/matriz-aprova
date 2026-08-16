import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { registerCurrentSession } from "@/lib/supabase/register-session"
import { notifyLogin, registrarLoginEvento } from "@/lib/login-alert"

/**
 * Sessão única por conta: chamado logo após o login (senha) para
 * registrar a sessão recém-criada como a ativa — o Google OAuth e
 * o link de e-mail registram direto no /auth/callback.
 *
 * De quebra, registra o acesso no histórico (/seguranca) e dispara o
 * e-mail de aviso de novo acesso. O cadastro manda `{ notify: false }`:
 * quem acabou de criar a conta já recebe o boas-vindas — o aviso de
 * login ali seria só ruído (o histórico é registrado de qualquer forma).
 */
export async function POST(req: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  await registerCurrentSession(supabase)
  await registrarLoginEvento(supabase, req.headers)

  const body = await req.json().catch(() => ({} as { notify?: boolean }))
  if (body.notify === false || !user.email) {
    return NextResponse.json({ ok: true })
  }

  const { data: perfil } = await supabase.from("profiles").select("nome").eq("id", user.id).single()
  await notifyLogin({
    nome: perfil?.nome ?? user.email.split("@")[0],
    email: user.email,
    headers: req.headers,
  })

  return NextResponse.json({ ok: true })
}
