import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

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
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { error } = await supabase.from("membros").delete().eq("grupo_id", params.id).eq("user_id", user.id)

  if (error) {
    console.error("Erro ao sair do grupo:", error)
    return NextResponse.json({ error: "Erro ao sair do grupo" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
