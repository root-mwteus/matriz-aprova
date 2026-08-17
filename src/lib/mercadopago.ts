import { createHmac, timingSafeEqual } from "crypto"
import { SITE_URL } from "@/lib/constants"

/**
 * Mercado Pago — Checkout Pro.
 *
 * Só o servidor fala com a API do MP (access token). O cliente recebe
 * o `init_point` da preferência e redireciona; o webhook confirma o
 * pagamento e promove o perfil para vitalício.
 *
 * Preço interno em centavos (inteiro), como nossa tabela `pagamentos`
 * guarda. Na preferência do Checkout Pro o MP espera o valor em reais
 * (`unit_price`), então dividimos por 100 na hora de enviar.
 */

export const PLANO_VITALICIO = {
  titulo: "Plano Vitalício Matriz Aprova",
  valorCentavos: 4999,
  valorExibido: "R$ 49,99",
} as const

const API_BASE = "https://api.mercadopago.com"
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

function headers() {
  if (!ACCESS_TOKEN) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
  }
  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  }
}

export interface MpPreference {
  id: string
  init_point: string
  sandbox_init_point?: string
}

/** Token de teste começa com TEST-. Em produção é APP_USR-. */
export function isTestMode() {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith("TEST-") ?? false
}

/**
 * Link de checkout correto para o modo atual. Em teste o `init_point`
 * leva ao checkout de produção, que rejeita cartão de teste — por isso
 * o sandbox_init_point é usado com credencial TEST-.
 */
export function initPointDaPreferencia(pref: MpPreference) {
  if (isTestMode()) return pref.sandbox_init_point ?? pref.init_point
  return pref.init_point
}

export interface MpPayment {
  id: number
  status: "approved" | "pending" | "rejected" | "cancelled" | "refunded"
  status_detail?: string
  transaction_amount: number
  external_reference?: string
  /** Espelha a metadata da preferência — hoje, o preferencia_id local. */
  metadata?: { preferencia_id?: string }
}

export async function criarPreferencia(opts: {
  userId: string
  email: string
  preferenciaId: string
  /** Título do item no checkout — vem da config editável do admin. */
  titulo?: string
  /** Preço em centavos — vem da config editável do admin. */
  valorCentavos?: number
}): Promise<MpPreference> {
  const titulo = opts.titulo ?? PLANO_VITALICIO.titulo
  const valorCentavos = opts.valorCentavos ?? PLANO_VITALICIO.valorCentavos

  const res = await fetch(`${API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      items: [
        {
          id: "plano-vitalicio",
          title: titulo,
          quantity: 1,
          unit_price: valorCentavos / 100,
          currency_id: "BRL",
        },
      ],
      external_reference: opts.userId,
      notification_url: `${SITE_URL}/api/pagamentos/webhook`,
      back_urls: {
        success: `${SITE_URL}/assinar?resultado=success`,
        pending: `${SITE_URL}/assinar?resultado=pending`,
        failure: `${SITE_URL}/assinar?resultado=failure`,
      },
      auto_return: "approved",
      payer: { email: opts.email },
      metadata: { preferencia_id: opts.preferenciaId },
    }),
  })

  if (!res.ok) {
    const texto = await res.text().catch(() => "")
    console.error("Mercado Pago: erro ao criar preferência", res.status, texto)
    throw new Error(`Erro do Mercado Pago ao criar preferência (${res.status})`)
  }

  return res.json()
}

export async function buscarPagamento(paymentId: string | number): Promise<MpPayment> {
  const res = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const texto = await res.text().catch(() => "")
    console.error("Mercado Pago: erro ao buscar pagamento", res.status, texto)
    throw new Error(`Erro do Mercado Pago ao consultar pagamento (${res.status})`)
  }

  return res.json()
}

/** Normaliza o id numérico que o webhook manda como string. */
export function parsePaymentId(raw: unknown): string | null {
  if (typeof raw === "string" && /^\d+$/.test(raw)) return raw
  if (typeof raw === "number" && Number.isInteger(raw)) return String(raw)
  return null
}

/**
 * Valida a assinatura HMAC-SHA256 do webhook do Mercado Pago.
 *
 * O MP assina cada notificação com a "secret signature" configurada em
 * Tus integraciones → Webhooks. O header `x-signature` tem o formato
 * `ts=<timestamp>,v1=<hmac>` e o HMAC cobre o manifest:
 *
 *   `<data.id do query> + <ts> + <raw body>`
 *
 * Retorna false se o header/secret faltar ou o hash não bater. Sem o
 * secret configurado (MERCADOPAGO_WEBHOOK_SECRET) rejeita tudo — nunca
 * aceita webhook sem verificação.
 */
export function verificarAssinaturaWebhook(opts: {
  xSignature: string | null
  dataId: string | null
  rawBody: string
}): boolean {
  const { xSignature, dataId, rawBody } = opts

  if (!xSignature) return false
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return false

  const tsMatch = /(?:^|,)\s*ts=(\d+)/.exec(xSignature)
  const v1Match = /(?:^|,)\s*v1=([a-f0-9]{64})/.exec(xSignature)
  if (!tsMatch || !v1Match || !dataId) return false

  const ts = tsMatch[1]
  const v1 = v1Match[1]

  const manifest = `${dataId}${ts}${rawBody}`
  const digest = createHmac("sha256", secret).update(manifest).digest()

  const received = Buffer.from(v1, "hex")
  if (digest.length !== received.length) return false
  return timingSafeEqual(digest, received)
}
