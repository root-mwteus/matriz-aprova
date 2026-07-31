import { describe, expect, it } from "vitest"
import { resolveApiUrl } from "@/lib/fetch-utils"

describe("resolveApiUrl", () => {
  it("monta uma URL absoluta a partir do caminho da API", () => {
    expect(resolveApiUrl("/api/email/boas-vindas", "https://app.exemplo.com")).toBe(
      "https://app.exemplo.com/api/email/boas-vindas"
    )
  })

  it("mantém uma URL já absoluta", () => {
    expect(resolveApiUrl("https://api.exemplo.com/ok", "https://app.exemplo.com")).toBe(
      "https://api.exemplo.com/ok"
    )
  })
})
