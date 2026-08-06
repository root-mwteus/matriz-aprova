import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

const GrupoIdSchema = z.string().uuid()

interface LinhaRanking {
  user_id: string
  questoes: number
  acertos: number
}

interface Entry extends LinhaRanking {
  nome: string
  pct: number
}

/**
 * GET /api/comunidade/grupos/[id]/ranking
 *
 * Ranking de questões/acertos apenas entre os membros do grupo.
 * Só quem é membro enxerga o ranking do grupo.
 */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!GrupoIdSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: membro } = await service
    .from("membros")
    .select("id")
    .eq("grupo_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!membro) {
    return NextResponse.json({ error: "Você precisa entrar no grupo para ver o ranking" }, { status: 403 })
  }

  const { data: linhas, error } = await service.rpc("ranking_grupo", {
    p_grupo_id: params.id,
    p_limite: 50,
  })

  if (error) {
    console.error("ranking do grupo: erro ao agregar respostas", error)
    return NextResponse.json({ error: "Erro ao carregar ranking" }, { status: 500 })
  }

  const rows = (linhas as LinhaRanking[] | null) ?? []

  const ids = rows.map((r) => r.user_id)
  const { data: perfis } = ids.length
    ? await service.from("profiles").select("id, nome").in("id", ids)
    : { data: [] }
  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome || "Anônimo"]))

  const ranking: Entry[] = rows.map((r) => ({
    ...r,
    nome: nomes.get(r.user_id) || "Anônimo",
    pct: r.questoes > 0 ? Math.round((r.acertos / r.questoes) * 100) : 0,
  }))

  return NextResponse.json({ ranking, meu_id: user.id })
}
