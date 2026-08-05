import { describe, expect, it, vi, beforeEach } from "vitest"
import { verificarAssinaturaWebhook, parsePaymentId } from "@/lib/mercadopago"

const SECRET = "test-secret-123"

beforeEach(() => {
  vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", SECRET)
})

describe("verificarAssinaturaWebhook", () => {
  it("aceita assinatura válida", () => {
    const rawBody = JSON.stringify({ type: "payment", data: { id: "123456" } })
    const ts = "1704908010"
    const manifest = `123456${ts}${rawBody}`
    const v1 = createHash(manifest)
    const xSignature = `ts=${ts},v1=${v1}`

    const result = verificarAssinaturaWebhook({
      xSignature,
      dataId: "123456",
      rawBody,
    })
    expect(result).toBe(true)
  })

  it("rejeita assinatura com body adulterado", () => {
    const rawBody = JSON.stringify({ type: "payment", data: { id: "123456" } })
    const ts = "1704908010"
    const v1 = createHash(`123456${ts}${rawBody}`)
    const xSignature = `ts=${ts},v1=${v1}`

    const resultado = verificarAssinaturaWebhook({
      xSignature,
      dataId: "123456",
      rawBody: JSON.stringify({ type: "payment", data: { id: "999999" } }),
    })
    expect(resultado).toBe(false)
  })

  it("rejeita quando header x-signature está ausente", () => {
    const result = verificarAssinaturaWebhook({
      xSignature: null,
      dataId: "123456",
      rawBody: "{}",
    })
    expect(result).toBe(false)
  })

  it("rejeita quando secret não está configurada", () => {
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "")
    const result = verificarAssinaturaWebhook({
      xSignature: "ts=1704908010,v1=" + "a".repeat(64),
      dataId: "123456",
      rawBody: "{}",
    })
    expect(result).toBe(false)
  })

  it("rejeita hash com formato inválido", () => {
    const result = verificarAssinaturaWebhook({
      xSignature: "ts=1704908010,v1=abc",
      dataId: "123456",
      rawBody: "{}",
    })
    expect(result).toBe(false)
  })

  it("rejeita quando data.id está ausente", () => {
    const result = verificarAssinaturaWebhook({
      xSignature: `ts=1704908010,v1=${"a".repeat(64)}`,
      dataId: null,
      rawBody: "{}",
    })
    expect(result).toBe(false)
  })

  it("suporta header com ordem invertida (v1 primeiro)", () => {
    const rawBody = "{}"
    const ts = "1704908010"
    const v1 = createHash(`555${ts}${rawBody}`)
    const xSignature = `v1=${v1},ts=${ts}`

    const result = verificarAssinaturaWebhook({
      xSignature,
      dataId: "555",
      rawBody,
    })
    expect(result).toBe(true)
  })
})

describe("parsePaymentId", () => {
  it("aceita string numérica", () => {
    expect(parsePaymentId("123456")).toBe("123456")
  })

  it("aceita número inteiro", () => {
    expect(parsePaymentId(123456)).toBe("123456")
  })

  it("rejeita string não numérica", () => {
    expect(parsePaymentId("abc")).toBeNull()
  })

  it("rejeita float", () => {
    expect(parsePaymentId(1.5)).toBeNull()
  })

  it("rejeita null e undefined", () => {
    expect(parsePaymentId(null)).toBeNull()
    expect(parsePaymentId(undefined)).toBeNull()
  })
})

function createHash(input: string): string {
  const { createHmac } = require("crypto")
  return createHmac("sha256", SECRET).update(input).digest("hex")
}
