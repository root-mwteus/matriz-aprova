import { NextRequest, NextResponse } from "next/server"
import { sendBoasVindas } from "@/lib/email"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body?.email || !body?.nome) {
    return NextResponse.json({ error: "email e nome obrigatórios" }, { status: 400 })
  }

  const { error } = await sendBoasVindas({
    nome: body.nome,
    email: body.email,
    area: body.area ?? "Concursos",
  })

  if (error) {
    console.error("[email/boas-vindas]", error)
    return NextResponse.json({ error: "falha ao enviar email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
