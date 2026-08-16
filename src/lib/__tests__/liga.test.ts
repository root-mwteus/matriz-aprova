import { describe, expect, it, vi } from "vitest"
import { PONTOS, chaveSemana } from "@/lib/liga"
import { finalizarDuelo, type Duelo } from "@/lib/duelo"
import { diasAte } from "@/lib/utils"

describe("chaveSemana", () => {
  it("retorna a segunda-feira da mesma semana (quinta)", () => {
    expect(chaveSemana(new Date("2026-08-20T15:30:00Z"))).toBe("2026-08-17")
  })

  it("domingo volta para a segunda anterior", () => {
    expect(chaveSemana(new Date("2026-08-23T01:00:00Z"))).toBe("2026-08-17")
  })

  it("segunda-feira é ela mesma", () => {
    expect(chaveSemana(new Date("2026-08-17T23:59:59Z"))).toBe("2026-08-17")
  })
})

describe("diasAte", () => {
  it("conta em dias civis, não em 24h", () => {
    expect(diasAte("2026-08-17")).toBe(diasAte(new Date("2026-08-17T23:00:00")))
  })

  it("data passada é negativa", () => {
    expect(diasAte("2000-01-01")).toBeLessThan(0)
  })
})

function dueloBase(overrides: Partial<Duelo> = {}): Duelo {
  return {
    id: "d1",
    status: "ativo",
    jogador_a: "aaa",
    jogador_b: "bbb",
    questoes: ["q1", "q2", "q3", "q4", "q5"],
    respostas_a: [],
    respostas_b: [],
    acertos_a: 0,
    acertos_b: 0,
    tempo_a: 0,
    tempo_b: 0,
    vencedor: null,
    created_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    ...overrides,
  }
}

function mockService(fechado: Duelo) {
  return {
    from: () => ({
      update: (dados: Record<string, unknown>) => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: { ...fechado, ...dados }, error: null }),
          }),
        }),
      }),
    }),
    rpc: vi.fn(async () => ({ error: null })),
  } as never
}

describe("finalizarDuelo", () => {
  it("mais acertos vence", async () => {
    const d = dueloBase({ acertos_a: 4, acertos_b: 2 })
    const fechado = await finalizarDuelo(mockService(d), d)
    expect(fechado.vencedor).toBe("aaa")
  })

  it("empate de acertos decide pelo tempo total", async () => {
    const d = dueloBase({ acertos_a: 3, acertos_b: 3, tempo_a: 120, tempo_b: 90 })
    const fechado = await finalizarDuelo(mockService(d), d)
    expect(fechado.vencedor).toBe("bbb")
  })

  it("acertos e tempo iguais terminam empatados", async () => {
    const d = dueloBase({ acertos_a: 3, acertos_b: 3, tempo_a: 100, tempo_b: 100 })
    const fechado = await finalizarDuelo(mockService(d), d)
    expect(fechado.vencedor).toBeNull()
  })
})

describe("PONTOS", () => {
  it("vitória de duelo vale mais que simulado", () => {
    expect(PONTOS.DUELO_VITORIA).toBeGreaterThan(PONTOS.SIMULADO)
  })
})
