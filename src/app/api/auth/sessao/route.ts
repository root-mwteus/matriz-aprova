import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { registerCurrentSession } from "@/lib/supabase/register-session"

/**
 * Sessão única por conta: chamado logo após o login (senha) para
 * registrar a sessão recém-criada como a ativa — o Google OAuth e
 * o link de e-mail registram direto no /auth/callback.
 */
export async function POST() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  await registerCurrentSession(supabase)
  return NextResponse.json({ ok: true })
}
