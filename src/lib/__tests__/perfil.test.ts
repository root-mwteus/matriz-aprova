import { describe, expect, it } from "vitest"
import {
  extensaoDeMime,
  imagemValida,
  moldurasDesbloqueadas,
  molduraUsavel,
} from "@/lib/perfil"
import type { Moldura } from "@/types"

const livre: Moldura = {
  id: "a",
  slug: "basica",
  nome: "Básica",
  arquivo: "basica.png",
  desbloqueio: "livre",
  created_at: "",
}

const vital: Moldura = {
  id: "b",
  slug: "dourada",
  nome: "Dourada",
  arquivo: "dourada.png",
  desbloqueio: "vitalicio",
  created_at: "",
}

describe("moldurasDesbloqueadas", () => {
  it("demo só desbloqueia as livres", () => {
    expect(moldurasDesbloqueadas([livre, vital], "demo")).toEqual([livre])
  })

  it("vitalício desbloqueia todas", () => {
    expect(moldurasDesbloqueadas([livre, vital], "vitalicio")).toEqual([livre, vital])
  })
})

describe("molduraUsavel", () => {
  it("retorna a moldura quando desbloqueada", () => {
    expect(molduraUsavel("b", [livre, vital], "vitalicio")).toBe(vital)
  })

  it("ignora moldura travada no demo", () => {
    expect(molduraUsavel("b", [livre, vital], "demo")).toBeNull()
  })

  it("ignora id inexistente", () => {
    expect(molduraUsavel("zzz", [livre], "vitalicio")).toBeNull()
  })

  it("sem moldura não retorna nada", () => {
    expect(molduraUsavel(null, [livre], "demo")).toBeNull()
  })
})

describe("imagemValida", () => {
  it("aceita png, jpeg, webp e gif", () => {
    for (const mime of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(imagemValida(mime)).toBe(true)
    }
  })

  it("recusa outros tipos", () => {
    expect(imagemValida("image/svg+xml")).toBe(false)
    expect(imagemValida("text/plain")).toBe(false)
  })
})

describe("extensaoDeMime", () => {
  it("mapeia os MIMEs aceitos para extensão", () => {
    expect(extensaoDeMime("image/png")).toBe("png")
    expect(extensaoDeMime("image/jpeg")).toBe("jpg")
    expect(extensaoDeMime("image/webp")).toBe("webp")
    expect(extensaoDeMime("image/gif")).toBe("gif")
  })

  it("retorna null para MIME desconhecido", () => {
    expect(extensaoDeMime("image/svg+xml")).toBeNull()
  })
})