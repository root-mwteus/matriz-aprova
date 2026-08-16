import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { buscarPagamento, parsePaymentId, verificarAssinaturaWebhook } from "@/lib/mercadopago"
import { getConfigPagamentos } from "@/lib/pagamentos-config"

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
    const config = await getConfigPagamentos(service)

    const { data: existente } = await service
      .from("pagamentos")
      .select("id, status")
      .eq("mp_payment_id", paymentId)
      .single()

    if (existente && existente.status === "approved") {
      return NextResponse.json({ ok: true })
    }

    // A linha criada no checkout carrega o valor combinado na hora —
    // checar contra config.valor_centavos rejeitaria qualquer preço
    // diferente do padrão (desconto de indicação, reajuste antigo).
    const preferenciaId = pagamento.metadata?.preferencia_id
    const { data: linhaCheckout } = preferenciaId
      ? await service
          .from("pagamentos")
          .select("id, valor")
          .eq("mp_preference_id", preferenciaId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null }

    const valorEsperado = linhaCheckout?.valor ?? config.valor_centavos

    if (Math.round(pagamento.transaction_amount * 100) !== valorEsperado) {
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

    if (linhaCheckout) {
      // Atualiza a linha do checkout em vez de criar outra — a tabela
      // fica com uma linha por compra, ligada ao payment id do MP.
      await service
        .from("pagamentos")
        .update({ mp_payment_id: paymentId, status: "approved", updated_at: new Date().toISOString() })
        .eq("id", linhaCheckout.id)
    } else {
      await registrar(paymentId, "approved", userId, valorEsperado)
    }

    // Indicação consumida: o desconto foi usado nesta compra.
    await service
      .from("indicacoes")
      .update({ status: "usada", usada_em: new Date().toISOString() })
      .eq("indicado_id", userId)
      .eq("status", "pendente")

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("webhook: erro ao processar", e)
    return NextResponse.json({ ok: true })
  }
}

async function registrar(mpPaymentId: string, status: string, userId?: string, valorCentavos?: number) {
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

    const config = await getConfigPagamentos(service)

    await service.from("pagamentos").insert({
      user_id: userId,
      mp_payment_id: mpPaymentId,
      status,
      valor: valorCentavos ?? config.valor_centavos,
    })
  } catch (e) {
    console.error("webhook: falha ao registrar pagamento", e)
  }
}
