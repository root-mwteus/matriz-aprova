import { describe, it, expect } from "vitest"
import { calcularStreakSemana } from "../streak"

// Helpers
function dataISO(ano: number, mes: number, dia: number): string {
  return new Date(ano, mes - 1, dia, 12, 0, 0).toISOString()
}

// Semana de referência: segunda 22/06/2026 a domingo 28/06/2026
// Quarta-feira: 24/06/2026 (índice 2)
const QUARTA = new Date(2026, 5, 24) // dia atual simulado

describe("calcularStreakSemana", () => {
  it("retorna 7 false quando não há respostas", () => {
    const resultado = calcularStreakSemana([], QUARTA)
    expect(resultado).toEqual([false, false, false, false, false, false, false])
  })

  it("marca segunda como true quando há resposta na segunda", () => {
    const respostas = [{ created_at: dataISO(2026, 6, 22) }] // segunda 22/06
    const resultado = calcularStreakSemana(respostas, QUARTA)
    expect(resultado[0]).toBe(true)  // segunda
    expect(resultado[1]).toBe(false) // terça
  })

  it("marca o dia correto quando há resposta hoje (quarta = índice 2)", () => {
    const respostas = [{ created_at: dataISO(2026, 6, 24) }] // quarta 24/06
    const resultado = calcularStreakSemana(respostas, QUARTA)
    expect(resultado[2]).toBe(true)
  })

  it("marca múltiplos dias com múltiplas respostas", () => {
    const respostas = [
      { created_at: dataISO(2026, 6, 22) }, // segunda
      { created_at: dataISO(2026, 6, 24) }, // quarta (índice 2)
    ]
    const resultado = calcularStreakSemana(respostas, QUARTA)
    expect(resultado[0]).toBe(true)  // segunda
    expect(resultado[1]).toBe(false) // terça
    expect(resultado[2]).toBe(true)  // quarta
  })

  it("ignora respostas fora da semana atual", () => {
    const respostas = [
      { created_at: dataISO(2026, 6, 15) }, // semana passada
      { created_at: dataISO(2026, 7, 1) },  // semana que vem
    ]
    const resultado = calcularStreakSemana(respostas, QUARTA)
    expect(resultado.every((d) => d === false)).toBe(true)
  })

  it("funciona quando hoje é domingo (getDay() === 0)", () => {
    const DOMINGO = new Date(2026, 5, 28) // domingo 28/06
    const respostas = [{ created_at: dataISO(2026, 6, 28) }]
    const resultado = calcularStreakSemana(respostas, DOMINGO)
    expect(resultado[6]).toBe(true) // domingo = índice 6
  })

  it("ignora múltiplas respostas no mesmo dia (conta só uma vez)", () => {
    const respostas = [
      { created_at: dataISO(2026, 6, 22) },
      { created_at: dataISO(2026, 6, 22) },
      { created_at: dataISO(2026, 6, 22) },
    ]
    const resultado = calcularStreakSemana(respostas, QUARTA)
    expect(resultado[0]).toBe(true)
    expect(resultado.filter(Boolean).length).toBe(1)
  })
})
