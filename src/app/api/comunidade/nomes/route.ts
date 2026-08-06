import { NextResponse } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { requireUser } from "@/lib/supabase/auth"

export const dynamic = "force-dynamic"

/**
 * GET /api/comunidade/nomes?ids=uuid1,uuid2
 *
 * Nomes de vários usuários de uma vez. O RLS de `profiles` só expõe o
 * próprio perfil, então o chat (que usa Realtime direto no cliente) não
 * saberia o nome de quem acabou de mandar mensagem. A rota autentica
 * quem chama e busca pelo service client.
 */
export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const ids = searchParams
    .get("ids")
    ?.split(",")
    .map((s) => s.trim())
    .filter((s) => z.string().uuid().safeParse(s).success)

  if (!ids?.length) {
    return NextResponse.json({ nomes: {} })
  }

  const service = createServiceClient()
  const { data: perfis } = await service.from("profiles").select("id, nome").in("id", ids)

  const nomes: Record<string, string> = {}
  for (const p of perfis ?? []) {
    nomes[p.id] = p.nome || "Anônimo"
  }

  return NextResponse.json({ nomes })
}
