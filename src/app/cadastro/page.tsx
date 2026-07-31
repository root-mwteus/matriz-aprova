"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterData } from "@/lib/auth-validation"
import { AREAS } from "@/lib/constants"
import { AuthDivider, AuthError, AuthShell } from "@/components/auth/AuthShell"
import { GoogleButton, PasswordInput } from "@/components/auth/GoogleButton"
import { Button, Field, Input, Select } from "@/components/ui"

/**
 * Criação de conta.
 *
 * A lista de áreas era declarada aqui com um item vazio fazendo o papel
 * de placeholder; agora vem de `constants` e o placeholder é o próprio
 * `option` desabilitado, igual ao resto do produto.
 */
export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<RegisterData>({
    nome: "",
    email: "",
    password: "",
    area_concurso: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterData | "api", string>>>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const result = registerSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterData, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RegisterData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    let data, error
    try {
      const res = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nome: form.nome, area_concurso: form.area_concurso },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      data = res.data
      error = res.error
    } catch (e) {
      setErrors({ api: e instanceof Error ? e.message : "Erro inesperado ao criar conta" })
      setLoading(false)
      return
    }

    if (error) {
      setErrors({ api: error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: form.email,
        nome: form.nome,
        area_concurso: form.area_concurso,
        role: "user",
      })
    }

    // E-mail de boas-vindas: falhar aqui não pode travar o cadastro.
    fetch("/api/email/boas-vindas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, email: form.email, area: form.area_concurso }),
    }).catch(() => {})

    router.push("/onboarding")
    router.refresh()
  }

  return (
    <AuthShell
      title="Criar conta"
      description="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-accent-ink hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        <Field label="Nome completo" error={errors.nome}>
          {(props) => (
            <Input
              {...props}
              autoComplete="name"
              autoFocus
              placeholder="Seu nome"
              className="h-10"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          )}
        </Field>

        <Field label="E-mail" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="h-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
        </Field>

        <Field label="Senha" error={errors.password} hint="Mínimo de 6 caracteres.">
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              placeholder="Crie uma senha"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>

        <Field
          label="Área de concurso"
          error={errors.area_concurso}
          hint="Define quais questões e materiais aparecem primeiro."
        >
          {(props) => (
            <Select
              {...props}
              className="h-10"
              value={form.area_concurso}
              onChange={(e) => setForm({ ...form, area_concurso: e.target.value })}
            >
              <option value="" disabled>
                Selecione sua área
              </option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <AuthError>{errors.api}</AuthError>

        <Button type="submit" variant="accent" size="lg" block loading={loading}>
          Criar conta
        </Button>
      </form>

      <AuthDivider />

      <GoogleButton label="Cadastrar com Google" onError={(m) => setErrors({ api: m })} />
    </AuthShell>
  )
}
