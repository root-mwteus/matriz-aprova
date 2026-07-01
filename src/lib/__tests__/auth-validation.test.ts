import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema, forgotSchema } from "../auth-validation"

describe("loginSchema", () => {
  it("aceita email e senha válidos", () => {
    const result = loginSchema.safeParse({ email: "aluno@gmail.com", password: "123456" })
    expect(result.success).toBe(true)
  })

  it("rejeita email inválido", () => {
    const result = loginSchema.safeParse({ email: "nao-e-email", password: "123456" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Email inválido")
  })

  it("rejeita senha com menos de 6 caracteres", () => {
    const result = loginSchema.safeParse({ email: "aluno@gmail.com", password: "123" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("A senha deve ter no mínimo 6 caracteres")
  })
})

describe("registerSchema", () => {
  const base = {
    nome: "Maria Silva",
    email: "maria@gmail.com",
    password: "123456",
    area_concurso: "Policia Federal",
  }

  it("aceita dados válidos", () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })

  it("rejeita nome com menos de 3 caracteres", () => {
    const result = registerSchema.safeParse({ ...base, nome: "Ma" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Nome deve ter no mínimo 3 caracteres")
  })

  it("rejeita area_concurso vazia", () => {
    const result = registerSchema.safeParse({ ...base, area_concurso: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Selecione uma área")
  })
})

describe("forgotSchema", () => {
  it("aceita email válido", () => {
    expect(forgotSchema.safeParse({ email: "aluno@gmail.com" }).success).toBe(true)
  })

  it("rejeita email inválido", () => {
    const result = forgotSchema.safeParse({ email: "invalido" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Email inválido")
  })
})
