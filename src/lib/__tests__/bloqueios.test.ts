import { describe, expect, it } from "vitest"
import { SECOES_PAINEL, secaoDaRota } from "@/lib/bloqueios"

const secoes = SECOES_PAINEL.map((s) => s.secao)

describe("secaoDaRota", () => {
  it("rota exata pertence à própria seção", () => {
    expect(secaoDaRota("/questoes", secoes)).toBe("/questoes")
  })

  it("sub-rota herda da seção raiz", () => {
    expect(secaoDaRota("/comunidade/ligas", secoes)).toBe("/comunidade")
    expect(secaoDaRota("/questoes/historico", secoes)).toBe("/questoes")
  })

  it("prefixo quase igual não confunde (comunidade-x não é comunidade)", () => {
    expect(secaoDaRota("/comunidade-x", secoes)).toBeNull()
  })

  it("rota fora das seções não pertence a nenhuma (dashboard segue livre)", () => {
    expect(secaoDaRota("/dashboard", secoes)).toBeNull()
    expect(secaoDaRota("/onboarding", secoes)).toBeNull()
  })

  it("seções bloqueadas filtradas: só as bloqueadas entram no match", () => {
    expect(secaoDaRota("/editais", ["/questoes"])).toBeNull()
    expect(secaoDaRota("/questoes", ["/questoes"])).toBe("/questoes")
  })
})
