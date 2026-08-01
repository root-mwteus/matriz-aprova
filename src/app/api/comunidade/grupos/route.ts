import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const CriarGrupoSchema = z.object({
  nome: z.string().min(3, "O nome do grupo deve ter no mínimo 3 caracteres").max(80),
  descricao: z.string().max(500).optional().default(""),
  materia: z.string().min(1, "Escolha uma matéria"),
})

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: grupos, error } = await supabase
    .from("grupos")
    .select("id, nome, descricao, materia, criador_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Erro ao listar grupos:", error)
    return NextResponse.json({ error: "Erro ao carregar grupos" }, { status: 500 })
  }

  const ids = grupos.map((g) => g.id)
  const criadores = Array.from(new Set(grupos.map((g) => g.criador_id)))

  const [membrosRes, perfisRes] = await Promise.all([
    ids.length
      ? supabase.from("membros").select("grupo_id, user_id").in("grupo_id", ids)
      : { data: [] },
    criadores.length
      ? supabase.from("profiles").select("id, nome").in("id", criadores)
      : { data: [] },
  ])

  const nomes = new Map((perfisRes.data ?? []).map((p) => [p.id, p.nome || "Anônimo"]))
  const contagem = new Map<string, number>()
  const meusGrupos = new Set<string>()
  for (const m of membrosRes.data ?? []) {
    contagem.set(m.grupo_id, (contagem.get(m.grupo_id) || 0) + 1)
    if (m.user_id === user.id) meusGrupos.add(m.grupo_id)
  }

  return NextResponse.json({
    meu_id: user.id,
    grupos: grupos.map((g) => ({
      id: g.id,
      nome: g.nome,
      descricao: g.descricao,
      materia: g.materia,
      membros_count: contagem.get(g.id) || 0,
      criado_em: g.created_at,
      criador_id: g.criador_id,
      criador_nome: nomes.get(g.criador_id) || "Anônimo",
      sou_membro: meusGrupos.has(g.id),
    })),
  })
}

export async function POST(request: Request) {
  const parsed = CriarGrupoSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: grupo, error } = await supabase
    .from("grupos")
    .insert({
      nome: parsed.data.nome.trim(),
      descricao: parsed.data.descricao.trim(),
      materia: parsed.data.materia,
      criador_id: user.id,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Erro ao criar grupo:", error)
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 })
  }

  return NextResponse.json({ id: grupo.id })
}
