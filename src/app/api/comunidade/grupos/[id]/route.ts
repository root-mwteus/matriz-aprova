import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

const GrupoIdSchema = z.string().uuid()

/**
 * GET /api/comunidade/grupos/[id]
 *
 * Detalhe do grupo: informações, lista de membros (com nomes, via
 * service_role) e se o usuário atual participa. O RLS de `profiles`
 * só expõe o próprio perfil, então os nomes vêm do service client.
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

  const { data: grupo } = await service
    .from("grupos")
    .select("id, nome, descricao, materia, criador_id, created_at")
    .eq("id", params.id)
    .single()

  if (!grupo) {
    return NextResponse.json({ error: "Grupo não encontrado" }, { status: 404 })
  }

  const [membrosRes, criadorRes] = await Promise.all([
    service.from("membros").select("user_id, created_at").eq("grupo_id", params.id).order("created_at", { ascending: true }),
    service.from("profiles").select("nome").eq("id", grupo.criador_id).single(),
  ])

  const membros = (membrosRes.data ?? []) as { user_id: string; created_at: string }[]

  const { data: perfis } = membros.length
    ? await service.from("profiles").select("id, nome").in("id", membros.map((m) => m.user_id))
    : { data: [] }
  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome || "Anônimo"]))

  return NextResponse.json({
    grupo: {
      id: grupo.id,
      nome: grupo.nome,
      descricao: grupo.descricao,
      materia: grupo.materia,
      criado_em: grupo.created_at,
      criador_id: grupo.criador_id,
      criador_nome: criadorRes.data?.nome || "Anônimo",
      membros_count: membros.length,
    },
    membros: membros.map((m) => ({
      user_id: m.user_id,
      nome: nomes.get(m.user_id) || "Anônimo",
      criador: m.user_id === grupo.criador_id,
    })),
    sou_membro: membros.some((m) => m.user_id === user.id),
    meu_id: user.id,
  })
}
