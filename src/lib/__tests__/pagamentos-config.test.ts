import { describe, expect, it } from "vitest"
import {
  formatarValor,
  parseValorParaCentavos,
  centavosParaTexto,
  precoCheioCentavos,
  parcela12xCentavos,
  economiaPct,
} from "@/lib/pagamentos-config"

describe("formatarValor", () => {
  it("formata centavos em BRL", () => {
    expect(formatarValor(4999)).toMatch(/R\$.*49,99/)
    expect(formatarValor(29700)).toMatch(/R\$.*297,00/)
    expect(formatarValor(0)).toMatch(/R\$.*0,00/)
  })
})

describe("parseValorParaCentavos", () => {
  it("aceita vírgula como decimal", () => {
    expect(parseValorParaCentavos("49,99")).toBe(4999)
  })

  it("aceita ponto como separador de milhar", () => {
    expect(parseValorParaCentavos("1.299,99")).toBe(129999)
  })

  it("aceita valor inteiro", () => {
    expect(parseValorParaCentavos("100")).toBe(10000)
  })

  it("rejeita valor inválido", () => {
    expect(parseValorParaCentavos("abc")).toBeNull()
    expect(parseValorParaCentavos("0")).toBeNull()
    expect(parseValorParaCentavos("-10")).toBeNull()
  })
})

describe("centavosParaTexto", () => {
  it("converte centavos para texto com vírgula", () => {
    expect(centavosParaTexto(4999)).toBe("49,99")
    expect(centavosParaTexto(29700)).toBe("297,00")
  })
})

describe("precoCheioCentavos", () => {
  it("deriva preço cheio de 4999 → 30000 (6× arredondado)", () => {
    expect(precoCheioCentavos(4999)).toBe(30000)
  })

  it("arredonda para centena", () => {
    expect(precoCheioCentavos(5000)).toBe(30000)
  })
})

describe("parcela12xCentavos", () => {
  it("divide em 12×", () => {
    expect(parcela12xCentavos(4999)).toBe(417)
  })

  it("arredonda centavos", () => {
    expect(parcela12xCentavos(5000)).toBe(417)
  })
})

describe("economiaPct", () => {
  it("calcula economia de 83% para 4999/29700", () => {
    expect(economiaPct(4999)).toBe(83)
  })

  it("retorna 0 se preço cheio é 0", () => {
    expect(economiaPct(0)).toBe(0)
  })
})
