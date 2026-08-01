import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

const GrupoIdSchema = z.string().uuid()

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!GrupoIdSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("membros")
    .upsert({ grupo_id: params.id, user_id: user.id }, { onConflict: "grupo_id,user_id", ignoreDuplicates: true })

  if (error) {
    console.error("Erro ao entrar no grupo:", error)
    return NextResponse.json({ error: "Erro ao entrar no grupo" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!GrupoIdSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Grupo inválido" }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from("membros").delete().eq("grupo_id", params.id).eq("user_id", user.id)

  if (error) {
    console.error("Erro ao sair do grupo:", error)
    return NextResponse.json({ error: "Erro ao sair do grupo" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
