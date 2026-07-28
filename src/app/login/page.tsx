"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginData } from "@/lib/auth-validation"
import { AuthDivider, AuthError, AuthShell } from "@/components/auth/AuthShell"
import { GoogleButton, PasswordInput } from "@/components/auth/GoogleButton"
import { Button, Field, Input } from "@/components/ui"

/**
 * Entrada.
 *
 * Correções sobre a versão anterior, todas de formulário:
 * · `<label>` não estava associado ao campo — clicar no rótulo não fazia
 *   nada e o leitor de tela não sabia o que era cada caixa. `Field` liga
 *   os dois e cuida também da mensagem de erro;
 * · faltava `autoComplete`, então o gerenciador de senhas não preenchia;
 * · a senha não tinha como ser revelada.
 */
function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [form, setForm] = useState<LoginData>({ email: "", password: "" })
  const [errors, setErrors] = useState<Partial<Record<keyof LoginData | "api", string>>>({})
  const [loading, setLoading] = useState(false)
  const contaSuspensa = searchParams.get("suspenso") === "1"

  function validate(): boolean {
    const result = loginSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginData, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoginData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      // Mensagem única de propósito: dizer qual dos dois está errado
      // permitiria descobrir quais e-mails têm conta.
      setErrors({ api: "E-mail ou senha incorretos." })
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <AuthShell
      title="Entrar"
      description="Continue de onde parou."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-accent-ink hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      {contaSuspensa && (
        <div className="mb-4">
          <AuthError>
            Sua conta foi suspensa. Entre em contato com o suporte para mais informações.
          </AuthError>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <Field label="E-mail" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="seu@email.com"
              className="h-10"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
        </Field>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="senha" className="text-sm font-medium text-fg">
              Senha
            </label>
            <Link
              href="/recuperar-senha"
              className="text-xs text-fg-subtle transition-colors duration-fast hover:text-fg"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput
            id="senha"
            placeholder="Sua senha"
            aria-invalid={errors.password ? true : undefined}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {errors.password && (
            <p role="alert" className="text-xs text-negative">
              {errors.password}
            </p>
          )}
        </div>

        <AuthError>{errors.api}</AuthError>

        <Button type="submit" variant="accent" size="lg" block loading={loading}>
          Entrar
        </Button>
      </form>

      <AuthDivider />

      <GoogleButton onError={(m) => setErrors({ api: m })} />
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
