import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { isTestMode, validarPayloadWebhook } from "@/lib/infinitepay"

beforeEach(() => {
  vi.stubEnv("INFINITEPAY_HANDLE", "matrizaprova")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("isTestMode", () => {
  it("padrão é produção", () => {
    expect(isTestMode()).toBe(false)
  })

  it("INFINITEPAY_TEST=true liga o modo teste", () => {
    vi.stubEnv("INFINITEPAY_TEST", "true")
    expect(isTestMode()).toBe(true)
  })
})

describe("validarPayloadWebhook", () => {
  const valido = {
    invoice_slug: "abc123",
    amount: 4999,
    paid_amount: 4999,
    installments: 1,
    capture_method: "pix",
    transaction_nsu: "uuid-transacao",
    order_nsu: "uuid-pedido",
    receipt_url: "https://comprovante.com/1",
    items: [{ quantity: 1, price: 4999, description: "Plano Vitalício" }],
  }

  it("aceita payload completo", () => {
    expect(validarPayloadWebhook(valido)).toEqual({
      orderNsu: "uuid-pedido",
      transactionNsu: "uuid-transacao",
      amount: 4999,
    })
  })

  it("rejeita body que não é objeto", () => {
    expect(validarPayloadWebhook(null)).toBeNull()
    expect(validarPayloadWebhook("texto")).toBeNull()
    expect(validarPayloadWebhook(undefined)).toBeNull()
  })

  it("rejeita sem order_nsu", () => {
    const { order_nsu: _sem, ...resto } = valido
    expect(validarPayloadWebhook(resto)).toBeNull()
  })

  it("rejeita sem transaction_nsu", () => {
    expect(validarPayloadWebhook({ ...valido, transaction_nsu: null })).toBeNull()
  })

  it("rejeita amount não numérico", () => {
    expect(validarPayloadWebhook({ ...valido, amount: "4999" })).toBeNull()
  })

  it("rejeita amount negativo", () => {
    expect(validarPayloadWebhook({ ...valido, amount: -1 })).toBeNull()
  })
})