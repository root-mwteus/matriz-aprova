import { NextRequest, NextResponse } from "next/server"
import { sendBoasVindas } from "@/lib/email"

// Mapa simples: IP → { count, resetAt }
const ipMap = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60 * 60 * 1000 // 1 hora
const MAX_REQUESTS = 5

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "muitas requisições" }, { status: 429 })
  }

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
