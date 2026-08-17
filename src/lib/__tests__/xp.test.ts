import { describe, expect, it } from "vitest"
import { XP, nivelDeXp, xpParaNivel, xpProximoNivel } from "@/lib/xp"

describe("xpParaNivel", () => {
  it("nível 1 custa 0", () => {
    expect(xpParaNivel(1)).toBe(0)
  })

  it("segue a curva triangular", () => {
    expect(xpParaNivel(2)).toBe(100)
    expect(xpParaNivel(3)).toBe(300)
    expect(xpParaNivel(4)).toBe(600)
    expect(xpParaNivel(5)).toBe(1000)
    expect(xpParaNivel(10)).toBe(4500)
  })
})

describe("nivelDeXp", () => {
  it("sem XP é nível 1", () => {
    expect(nivelDeXp(0)).toBe(1)
    expect(nivelDeXp(-5)).toBe(1)
  })

  it("fronteiras de cada nível", () => {
    expect(nivelDeXp(99)).toBe(1)
    expect(nivelDeXp(100)).toBe(2)
    expect(nivelDeXp(299)).toBe(2)
    expect(nivelDeXp(300)).toBe(3)
    expect(nivelDeXp(999)).toBe(4)
    expect(nivelDeXp(1000)).toBe(5)
  })

  it("valores grandes não estouram", () => {
    expect(nivelDeXp(100000)).toBe(45)
    expect(nivelDeXp(1_000_000)).toBe(141)
  })
})

describe("xpProximoNivel", () => {
  it("nível 1 no início", () => {
    const p = xpProximoNivel(0)
    expect(p.nivel).toBe(1)
    expect(p.xpBase).toBe(0)
    expect(p.xpAlvo).toBe(100)
    expect(p.faltando).toBe(100)
    expect(p.progresso).toBe(0)
  })

  it("progresso no meio do nível", () => {
    const p = xpProximoNivel(50)
    expect(p.nivel).toBe(1)
    expect(p.faltando).toBe(50)
    expect(p.progresso).toBe(50)
  })

  it("no limite do próximo nível", () => {
    const p = xpProximoNivel(100)
    expect(p.nivel).toBe(2)
    expect(p.xpBase).toBe(100)
    expect(p.faltando).toBe(200)
    expect(p.progresso).toBe(0)
  })

  it("XP de acerto/lançamentos coerentes", () => {
    expect(XP.RESPOSTA + XP.ACERTO).toBe(20)
    expect(XP.SIMULADO).toBe(50)
    expect(XP.DUELO_VITORIA).toBe(100)
  })
})