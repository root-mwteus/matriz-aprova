import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

/**
 * Ranking global de questões da comunidade.
 *
 * `user_answers` tem RLS do próprio usuário, então a rota autentica quem
 * chama e usa service_role no servidor para agregar de todos. A contagem
 * acontece no banco (função `ranking_questoes`), não no cliente.
 */

interface LinhaRanking {
  user_id: string
  questoes: number
  acertos: number
}

interface Entry extends LinhaRanking {
  nome: string
  icone_path: string | null
  moldura_id: string | null
  pct: number
}

export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: linhas, error } = await service.rpc("ranking_questoes", { p_limite: 50 })

  if (error) {
    console.error("ranking: erro ao agregar respostas", error)
    return NextResponse.json({ error: "Erro ao carregar ranking" }, { status: 500 })
  }

  const rows = (linhas as LinhaRanking[] | null) ?? []

  const ids = rows.map((r) => r.user_id)
  const { data: perfis } = ids.length
    ? await service.from("profiles").select("id, nome, icone_path, moldura_id").in("id", ids)
    : { data: [] }
  const porId = new Map(
    (perfis ?? []).map((p: { id: string; nome: string | null; icone_path: string | null; moldura_id: string | null }) => [
      p.id,
      p,
    ])
  )

  const ranking: Entry[] = rows.map((r) => {
    const perfil = porId.get(r.user_id)
    return {
      ...r,
      nome: perfil?.nome || "Anônimo",
      icone_path: perfil?.icone_path ?? null,
      moldura_id: perfil?.moldura_id ?? null,
      pct: r.questoes > 0 ? Math.round((r.acertos / r.questoes) * 100) : 0,
    }
  })

  return NextResponse.json({ ranking, meu_id: user.id })
}
