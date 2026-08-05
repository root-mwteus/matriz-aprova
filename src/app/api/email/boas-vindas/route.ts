import { NextResponse } from "next/server"
import { z } from "zod"
import { sendBoasVindas } from "@/lib/email"
import { requireUser } from "@/lib/supabase/auth"

// Mapa simples: user_id → { count, resetAt }
// O rate-limit é por usuário autenticado, não por IP (IP é forjável e
// compartilhado em rede corporativa/CFTV).
const userMap = new Map<string, { count: number; resetAt: number }>()
const WINDOW_MS = 60 * 60 * 1000 // 1 hora
const MAX_REQUESTS = 5

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = userMap.get(userId)

  if (!entry || now > entry.resetAt) {
    userMap.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

const BoasVindasSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(1).max(100),
  area: z.string().max(100).optional(),
})

export async function POST(req: Request) {
  const user = await requireUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "muitas requisições" }, { status: 429 })
  }

  const parsed = BoasVindasSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "email e nome obrigatórios" }, { status: 400 })
  }

  // Só envia para o e-mail da própria sessão — impede usar a API como
  // relay de spam para terceiros.
  if (parsed.data.email !== user.email) {
    return NextResponse.json({ error: "email não pertence à conta" }, { status: 403 })
  }

  const { error } = await sendBoasVindas({
    nome: parsed.data.nome,
    email: parsed.data.email,
    area: parsed.data.area ?? "Concursos",
  })

  if (error) {
    console.error("[email/boas-vindas]", error)
    return NextResponse.json({ error: "falha ao enviar email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
