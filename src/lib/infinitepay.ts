import { APP_URL } from "@/lib/constants"

/**
 * InfinitePay — Checkout Integrado.
 *
 * O checkout é hospedado pela InfinitePay: o servidor cria um link com
 * `POST /links` (identificado pela InfiniteTag/handle, sem token) e o
 * cliente é redirecionado para a `url` retornada. O webhook confirma a
 * aprovação e promove o perfil para vitalício.
 *
 * Preço em centavos (inteiro), como a tabela `pagamentos` guarda — a
 * API da InfinitePay também trabalha em centavos.
 *
 * Diferente do Mercado Pago, o webhook NÃO tem assinatura: a
 * autenticação é validar que o `order_nsu` (UUID aleatório gerado no
 * checkout, que só o servidor conhece) corresponde a um pedido real, e
 * o dedupe é por `transaction_nsu`.
 */

export const PLANO_VITALICIO = {
  titulo: "Plano Vitalício Matriz Aprova",
  valorCentavos: 4999,
  valorExibido: "R$ 49,99",
} as const

const API_BASE = "https://api.checkout.infinitepay.io"

/** Sua InfiniteTag (nome de usuário no app, sem o `$`). */
export function handle() {
  const h = process.env.INFINITEPAY_HANDLE
  if (!h) throw new Error("INFINITEPAY_HANDLE não configurado")
  return h
}

/** Modo teste é explícito por env — a InfinitePay não tem credencial TEST-. */
export function isTestMode() {
  return process.env.INFINITEPAY_TEST === "true"
}

export interface InfinitePayLink {
  url: string
}

export async function criarLink(opts: {
  email: string
  orderNsu: string
  /** Título do item no checkout — vem da config editável do admin. */
  titulo?: string
  /** Preço em centavos — vem da config editável do admin. */
  valorCentavos?: number
}): Promise<InfinitePayLink> {
  const titulo = opts.titulo ?? PLANO_VITALICIO.titulo
  const valorCentavos = opts.valorCentavos ?? PLANO_VITALICIO.valorCentavos

  const res = await fetch(`${API_BASE}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: handle(),
      items: [{ quantity: 1, price: valorCentavos, description: titulo }],
      order_nsu: opts.orderNsu,
      redirect_url: `${APP_URL}/assinar?resultado=success`,
      webhook_url: `${APP_URL}/api/pagamentos/webhook`,
      customer: { email: opts.email },
    }),
  })

  if (!res.ok) {
    const texto = await res.text().catch(() => "")
    console.error("InfinitePay: erro ao criar link", res.status, texto)
    throw new Error(`Erro da InfinitePay ao criar o checkout (${res.status})`)
  }

  return res.json()
}

export interface PagamentoInfinitepay {
  success: boolean
  paid: boolean
  amount: number
  paid_amount: number
  installments: number
  capture_method: string
}

/**
 * Consulta o status de um pagamento na InfinitePay. Usado como
 * conferência do webhook (que não tem assinatura) antes de promover.
 */
export async function consultarPagamento(opts: {
  orderNsu: string
  transactionNsu?: string | null
  slug?: string | null
}): Promise<PagamentoInfinitepay> {
  const res = await fetch(`${API_BASE}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle: handle(),
      order_nsu: opts.orderNsu,
      transaction_nsu: opts.transactionNsu ?? undefined,
      slug: opts.slug ?? undefined,
    }),
  })

  if (!res.ok) {
    const texto = await res.text().catch(() => "")
    console.error("InfinitePay: erro ao consultar pagamento", res.status, texto)
    throw new Error(`Erro da InfinitePay ao consultar pagamento (${res.status})`)
  }

  return res.json()
}

/** Payload do webhook de pagamento aprovado da InfinitePay. */
export interface WebhookInfinitepay {
  invoice_slug: string
  amount: number
  paid_amount: number
  installments: number
  capture_method: string
  transaction_nsu: string
  order_nsu: string
  receipt_url: string
  items: { quantity: number; price: number; description: string }[]
}

/** Campos do webhook que ancoram a validação (não assinada) do pedido. */
export interface WebhookIdentificadores {
  orderNsu: string
  transactionNsu: string
  amount: number
}

/**
 * Extrai e valida os identificadores do payload do webhook. Sem eles o
 * evento é descartável (400 para a InfinitePay tentar de novo).
 */
export function validarPayloadWebhook(body: unknown): WebhookIdentificadores | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  if (
    typeof b.order_nsu !== "string" ||
    typeof b.transaction_nsu !== "string" ||
    typeof b.amount !== "number" ||
    !(b.amount > 0)
  ) {
    return null
  }
  return { orderNsu: b.order_nsu, transactionNsu: b.transaction_nsu, amount: b.amount }
}