import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { sendRecuperarSenha } from "@/lib/email"
import { SITE_URL } from "@/lib/constants"

/**
 * Envia o link de redefinição de senha pela Resend.
 *
 * O link é gerado com o admin client (generateLink) em vez de
 * resetPasswordForEmail, que faria o próprio Supabase disparar o e-mail
 * dele. Aqui o Supabase só gera o link e quem entrega é a Resend, com o
 * visual da casa.
 *
 * A resposta é a mesma para e-mail existente ou não (200 + "se houver
 * conta") para não virar verificador de cadastros.
 */

// Rate-limit por IP em memória — a rota é pública (o usuário não está
// logado quando esquece a senha), então por IP é o melhor que dá sem
// custo; IP é forjável, mas já limita o pior caso de spam.
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

const RecuperarSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido"

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "muitas requisições" }, { status: 429 })
  }

  const parsed = RecuperarSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "email inválido" }, { status: 400 })
  }

  const email = parsed.data.email

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Sem service role não há como gerar o link nem verificar a conta —
    // responde neutro para manter o comportamento de "se houver conta".
    return NextResponse.json({ ok: true })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  })

  // Conta inexistente ou erro do provider: resposta neutra igual.
  if (error || !data?.properties?.action_link) {
    return NextResponse.json({ ok: true })
  }

  // Nome amigável quando existir; senão o prefixo do e-mail.
  const nome =
    data.user?.user_metadata?.nome ??
    data.user?.user_metadata?.full_name ??
    email.split("@")[0] ??
    "Estudante"

  const { error: sendError } = await sendRecuperarSenha({
    nome,
    email,
    link: data.properties.action_link,
  })

  if (sendError) {
    console.error("[auth/recuperar-senha]", sendError)
    return NextResponse.json({ error: "falha ao enviar email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}