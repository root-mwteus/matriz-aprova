import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"
import { chaveSemana } from "@/lib/liga"

/**
 * GET /api/comunidade/ligas
 *
 * Ranking de pontos da semana corrente (nomes resolvidos no servidor,
 * como os outros rankings). A divisão em ligas de 50 e as zonas de
 * promoção/rebaixamento são feitas no front — aqui é só a lista.
 */
export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: linhas, error } = await service.rpc("ranking_liga", {
    p_semana: chaveSemana(),
    p_limite: 200,
  })

  if (error) {
    console.error("ligas: erro ao carregar ranking", error)
    return NextResponse.json({ error: "Falha ao carregar a liga" }, { status: 500 })
  }

  const ids = (linhas ?? []).map((l: { user_id: string }) => l.user_id)
  const { data: perfis } = ids.length
    ? await service.from("profiles").select("id, nome, icone_path, moldura_id").in("id", ids)
    : { data: [] }

  const porId = new Map(
    (perfis ?? []).map(
      (p: { id: string; nome: string | null; icone_path: string | null; moldura_id: string | null }) => [
        p.id,
        p,
      ]
    )
  )

  return NextResponse.json({
    semana: chaveSemana(),
    meu_id: user.id,
    ranking: (linhas ?? []).map((l: { user_id: string; pontos: number }) => {
      const perfil = porId.get(l.user_id)
      return {
        user_id: l.user_id,
        nome: perfil?.nome ?? "Estudante",
        icone_path: perfil?.icone_path ?? null,
        moldura_id: perfil?.moldura_id ?? null,
        pontos: Number(l.pontos),
      }
    }),
  })
}
