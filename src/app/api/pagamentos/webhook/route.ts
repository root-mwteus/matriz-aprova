import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import {
  buscarPagamento,
  parsePaymentId,
  PLANO_VITALICIO,
  verificarAssinaturaWebhook,
} from "@/lib/mercadopago"

/**
 * POST /api/pagamentos/webhook
 *
 * O Mercado Pago notifica eventos de pagamento aqui. O fluxo:
 *  1. Valida a assinatura HMAC (`x-signature`) com a secret do MP.
 *  2. Confirma o id do pagamento com a API do MP (access token).
 *  3. Valida: external_reference (user_id), valor e status approved.
 *  4. Idempotente: um `mp_payment_id` já processado não re-executa.
 *  5. Promove o perfil para vitalício e registra o pagamento.
 *
 * Sempre responde 200 para o MP parar de reenviar — inclusive para
 * eventos irrelevantes e body inválido. Erros reais são logados.
 */

export async function POST(request: Request) {
  try {
    const rawBody = await request.clone().text()

    const dataId =
      new URL(request.url).searchParams.get("data.id") ??
      JSON.parse(rawBody || "{}")?.data?.id ??
      JSON.parse(rawBody || "{}")?.id

    const assinaturaValida = verificarAssinaturaWebhook({
      xSignature: request.headers.get("x-signature"),
      dataId: typeof dataId === "string" ? dataId : null,
      rawBody,
    })

    if (!assinaturaValida) {
      console.error("webhook: assinatura inválida", request.headers.get("x-signature"))
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const body = JSON.parse(rawBody || "{}")

    const paymentId = parsePaymentId(body?.data?.id ?? body?.id)
    if (!paymentId) {
      // Evento sem pagamento (ex.: teste de conexão do MP) — ignora.
      return NextResponse.json({ ok: true })
    }

    const pagamento = await buscarPagamento(paymentId)

    if (pagamento.status !== "approved") {
      // Pending/rejected/cancelled: registra mas não promove.
      await registrar(paymentId, pagamento.status, pagamento.external_reference)
      return NextResponse.json({ ok: true })
    }

    const userId = pagamento.external_reference
    if (!userId) {
      console.error("webhook: pagamento aprovado sem external_reference", paymentId)
      return NextResponse.json({ ok: true })
    }

    const service = createServiceClient()

    const { data: existente } = await service
      .from("pagamentos")
      .select("id, status")
      .eq("mp_payment_id", paymentId)
      .single()

    if (existente && existente.status === "approved") {
      return NextResponse.json({ ok: true })
    }

    if (Math.round(pagamento.transaction_amount * 100) !== PLANO_VITALICIO.valorCentavos) {
      console.error("webhook: valor inesperado no pagamento", paymentId, pagamento.transaction_amount)
      return NextResponse.json({ ok: true })
    }

    const { error: promoError } = await service
      .from("profiles")
      .update({ plano: "vitalicio" })
      .eq("id", userId)

    if (promoError) {
      console.error("webhook: falha ao promover perfil", promoError)
      return NextResponse.json({ ok: true })
    }

    await registrar(paymentId, "approved", userId)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("webhook: erro ao processar", e)
    return NextResponse.json({ ok: true })
  }
}

async function registrar(mpPaymentId: string, status: string, userId?: string) {
  try {
    const service = createServiceClient()
    const { data: existente } = await service
      .from("pagamentos")
      .select("id")
      .eq("mp_payment_id", mpPaymentId)
      .single()

    if (existente) {
      await service
        .from("pagamentos")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", existente.id)
      return
    }

    if (!userId) return

    await service.from("pagamentos").insert({
      user_id: userId,
      mp_payment_id: mpPaymentId,
      status,
      valor: PLANO_VITALICIO.valorCentavos,
    })
  } catch (e) {
    console.error("webhook: falha ao registrar pagamento", e)
  }
}
