import { describe, expect, it } from "vitest"
import { parseSessionId } from "@/lib/supabase/session"

function token(payload: Record<string, unknown>) {
  const part = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.assinatura`
}

describe("parseSessionId", () => {
  it("extrai o session_id do access token", () => {
    expect(parseSessionId(token({ sub: "user", session_id: "abc-123" }))).toBe("abc-123")
  })

  it("retorna null para token sem session_id", () => {
    expect(parseSessionId(token({ sub: "user" }))).toBeNull()
  })

  it("retorna null para token malformado", () => {
    expect(parseSessionId("nao-e-um-jwt")).toBeNull()
  })
})
