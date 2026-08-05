import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
})

export const registerSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  area_concurso: z.string().min(1, "Selecione uma área"),
})

export const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
})

export const redefinirSenhaSchema = z
  .object({
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmar: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  })
  .refine((data) => data.password === data.confirmar, {
    message: "As senhas não coincidem",
    path: ["confirmar"],
  })

export type LoginData = z.infer<typeof loginSchema>
export type RegisterData = z.infer<typeof registerSchema>
export type ForgotData = z.infer<typeof forgotSchema>
export type RedefinirSenhaData = z.infer<typeof redefinirSenhaSchema>
