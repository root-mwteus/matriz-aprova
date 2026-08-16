import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendAlertaEdital } from "@/lib/email"

/**
 * GET /api/cron/editais-alertas
 *
 * Cron diário da Vercel (12:00 UTC): envia e-mail dos editais
 * publicados nas últimas 24h para quem tem a mesma área de concurso.
 * O dedupe é a PK de `edital_alertas` — o upsert com ON CONFLICT DO
 * NOTHING só retorna quem de fato recebeu a linha, então rodar duas
 * vezes não duplica e-mail.
 *
 * Autenticação: a Vercel envia `Authorization: Bearer $CRON_SECRET`.
 * Sem a env configurada, recusa tudo (ninguém consegue disparar
 * disparates de e-mail em produção por adivinhar a URL).
 */
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const service = createServiceClient()

  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: editais } = await service
    .from("editais")
    .select("id, orgao, cargo, banca, vagas, data_prova, link, area_concurso")
    .in("status", ["aberto", "previsto"])
    .gte("created_at", desde)

  if (!editais?.length) {
    return NextResponse.json({ ok: true, enviados: 0 })
  }

  let enviados = 0

  for (const edital of editais) {
    const { data: usuarios } = await service
      .from("profiles")
      .select("id, email, nome")
      .eq("area_concurso", edital.area_concurso)
      .eq("suspenso", false)

    if (!usuarios?.length) continue

    // Só recebe e-mail quem recebeu linha nova — quem já foi alertado
    // (ou entrou em corrida com outra execução) não vem no retorno.
    const { data: inseridos } = await service
      .from("edital_alertas")
      .upsert(
        usuarios.map((u) => ({ user_id: u.id, edital_id: edital.id })),
        { onConflict: "user_id,edital_id", ignoreDuplicates: true }
      )
      .select("user_id")

    const novos = new Set(inseridos?.map((i) => i.user_id) ?? [])

    for (const usuario of usuarios) {
      if (!novos.has(usuario.id)) continue

      const { error } = await sendAlertaEdital({
        nome: usuario.nome ?? usuario.email.split("@")[0],
        email: usuario.email,
        orgao: edital.orgao,
        cargo: edital.cargo,
        banca: edital.banca,
        vagas: edital.vagas,
        dataProva: edital.data_prova,
        link: edital.link,
      })
      if (!error) enviados++
    }
  }

  return NextResponse.json({ ok: true, enviados })
}
