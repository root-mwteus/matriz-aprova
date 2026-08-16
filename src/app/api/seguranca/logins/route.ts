import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { parseSessionId } from "@/lib/supabase/session"
import { requireUser } from "@/lib/supabase/auth"

/**
 * GET /api/seguranca/logins
 *
 * Histórico de acessos da conta (página /seguraca). O session_id da
 * sessão atual vai junto para o front marcar qual entrada é "este
 * dispositivo".
 */
export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: eventos } = await createServiceClient()
    .from("login_events")
    .select("id, navegador, sistema, ip, session_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  return NextResponse.json({
    eventos: eventos ?? [],
    session_id_atual: session ? parseSessionId(session.access_token) : null,
  })
}
