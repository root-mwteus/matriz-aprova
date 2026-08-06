import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

const MensagemSchema = z.object({
  conteudo: z.string().trim().min(1, "Mensagem vazia").max(1000, "Mensagem muito longa"),
  grupo_id: z.string().uuid().nullable().optional(),
})

interface Mensagem {
  id: string
  user_id: string
  grupo_id: string | null
  conteudo: string
  created_at: string
}

/** Grupo existe e o usuário é membro? — usado para chat de grupo. */
async function ehMembro(service: ReturnType<typeof createServiceClient>, grupoId: string, userId: string) {
  const { data } = await service
    .from("membros")
    .select("id")
    .eq("grupo_id", grupoId)
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const grupoParam = searchParams.get("grupo_id")
  const grupoId = grupoParam ? grupoParam : null

  if (grupoParam && !z.string().uuid().safeParse(grupoParam).success) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const service = createServiceClient()

  // Chat de grupo é restrito a membros — o RLS do cliente já barraria,
  // mas a rota usa service_role e precisa conferir por conta própria.
  if (grupoId && !(await ehMembro(service, grupoId, user.id))) {
    return NextResponse.json({ error: "Você precisa entrar no grupo para conversar" }, { status: 403 })
  }

  let query = service.from("mensagens").select("id, user_id, grupo_id, conteudo, created_at")

  if (grupoId) {
    query = query.eq("grupo_id", grupoId)
  } else {
    query = query.is("grupo_id", null)
  }

  // Busca as últimas e devolve em ordem cronológica para exibição.
  const { data: mensagens, error } = await query.order("created_at", { ascending: false }).limit(50)

  if (error) {
    console.error("chat: erro ao listar mensagens", error)
    return NextResponse.json({ error: "Erro ao carregar mensagens" }, { status: 500 })
  }

  const rows = (mensagens as Mensagem[] | null) ?? []
  rows.reverse()

  const autores = Array.from(new Set(rows.map((m) => m.user_id)))
  const { data: perfis } = autores.length
    ? await service.from("profiles").select("id, nome").in("id", autores)
    : { data: [] }
  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome || "Anônimo"]))

  return NextResponse.json({
    meu_id: user.id,
    mensagens: rows.map((m) => ({
      ...m,
      nome: nomes.get(m.user_id) || "Anônimo",
    })),
  })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const parsed = MensagemSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const service = createServiceClient()

  if (parsed.data.grupo_id && !(await ehMembro(service, parsed.data.grupo_id, user.id))) {
    return NextResponse.json({ error: "Você precisa entrar no grupo para conversar" }, { status: 403 })
  }

  const { data: mensagem, error } = await service
    .from("mensagens")
    .insert({
      user_id: user.id,
      grupo_id: parsed.data.grupo_id ?? null,
      conteudo: parsed.data.conteudo,
    })
    .select("id, user_id, grupo_id, conteudo, created_at")
    .single()

  if (error) {
    console.error("chat: erro ao enviar mensagem", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }

  const { data: perfil } = await service.from("profiles").select("nome").eq("id", user.id).single()

  return NextResponse.json({
    mensagem: {
      ...mensagem,
      nome: perfil?.nome || "Anônimo",
    },
  })
}
