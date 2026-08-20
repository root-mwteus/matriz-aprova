import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { consultarPagamento, validarPayloadWebhook } from "@/lib/infinitepay"

/**
 * POST /api/pagamentos/webhook
 *
 * A InfinitePay notifica aqui quando um pagamento do Checkout Integrado
 * é aprovado. Diferente do Mercado Pago, não há assinatura HMAC — a
 * autenticação é outra:
 *
 *  1. `order_nsu` precisa bater com uma linha de `pagamentos` real (é um
 *     UUID aleatório gerado no checkout; só o servidor conhece).
 *  2. `transaction_nsu` é a chave de dedupe (UNIQUE na tabela): retry do
 *     mesmo pagamento não promove duas vezes.
 *  3. `amount` precisa bater com o valor gravado na linha do checkout.
 *  4. Conferência extra com `payment_check` antes de promover (defesa em
 *     profundidade — o webhook em si não é assinado).
 *
 * Responde 200 para confirmar e 400 para a InfinitePay tentar de novo.
 * Sempre 200 em eventos já processados ou fora do nosso domínio.
 */

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const ids = validarPayloadWebhook(body)
  if (!ids) {
    console.error("webhook: payload sem order_nsu/transaction_nsu/amount", JSON.stringify(body).slice(0, 200))
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const { orderNsu, transactionNsu, amount } = ids

  const service = createServiceClient()

  // Dedupe: a mesma transação nunca é processada duas vezes.
  const { data: jaProcessado } = await service
    .from("pagamentos")
    .select("id, status")
    .eq("transaction_nsu", transactionNsu)
    .maybeSingle()

  if (jaProcessado) {
    if (jaProcessado.status === "approved") {
      return NextResponse.json({ ok: true })
    }
    // Linha existe mas ainda não aprovada: segue e atualiza.
  }

  // Autenticação: o order_nsu tem que ser de um pedido nosso.
  const { data: linha } = await service
    .from("pagamentos")
    .select("id, user_id, valor")
    .eq("order_nsu", orderNsu)
    .maybeSingle()

  if (!linha) {
    console.error("webhook: order_nsu desconhecido", orderNsu)
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Conferência com a API antes de promover. Se a consulta falhar,
  // segue com o corpo — o order_nsu + valor já são prova forte (UUID
  // que só o servidor gera). Se responder que não está pago, não promove.
  try {
    const conferencia = await consultarPagamento({
      orderNsu,
      transactionNsu,
      slug: typeof body.invoice_slug === "string" ? body.invoice_slug : null,
    })
    if (!conferencia.paid) {
      console.warn("webhook: payment_check diz que o pagamento não foi pago", orderNsu)
      return NextResponse.json({ ok: true })
    }
  } catch (e) {
    console.error("webhook: falha na conferência (segue com o corpo)", e)
  }

  // Valor: o `amount` é o valor original do link (o que cobramos). Bater
  // com a linha garante que o desconto de indicação foi respeitado.
  if (amount !== linha.valor) {
    console.error("webhook: valor inesperado no pagamento", orderNsu, amount, "esperado", linha.valor)
    return NextResponse.json({ ok: true })
  }

  const { error: promoError } = await service
    .from("profiles")
    .update({ plano: "vitalicio" })
    .eq("id", linha.user_id)

  if (promoError) {
    console.error("webhook: falha ao promover perfil", promoError)
    return NextResponse.json({ ok: true })
  }

  await service
    .from("pagamentos")
    .update({ transaction_nsu: transactionNsu, status: "approved", updated_at: new Date().toISOString() })
    .eq("id", linha.id)

  // Indicação consumida: o desconto foi usado nesta compra.
  await service
    .from("indicacoes")
    .update({ status: "usada", usada_em: new Date().toISOString() })
    .eq("indicado_id", linha.user_id)
    .eq("status", "pendente")

  return NextResponse.json({ ok: true })
}