"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { redefinirSenhaSchema, type RedefinirSenhaData } from "@/lib/auth-validation"
import { AuthError, AuthShell } from "@/components/auth/AuthShell"
import { PasswordInput } from "@/components/auth/GoogleButton"
import { Button, Field } from "@/components/ui"

export function RedefinirSenhaForm() {
  const supabase = createClient()
  const [form, setForm] = useState<RedefinirSenhaData>({ password: "", confirmar: "" })
  const [errors, setErrors] = useState<Partial<Record<keyof RedefinirSenhaData | "api", string>>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function validate(): boolean {
    const result = redefinirSenhaSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RedefinirSenhaData, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof RedefinirSenhaData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    const { error } = await supabase.auth.updateUser({ password: form.password })

    if (error) {
      setErrors({
        api: "Não foi possível atualizar a senha. O link pode ter expirado — solicite um novo.",
      })
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <AuthShell title="Senha atualizada">
        <div className="flex flex-col items-center py-2 text-center">
          <p className="mt-4 text-base text-fg-muted">
            Sua senha foi alterada com sucesso. Entre com a nova senha.
          </p>

          <div className="mt-6 flex w-full flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-fg-on-accent shadow-xs transition-colors duration-fast hover:bg-accent-hover"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Definir nova senha" description="Escolha uma senha nova para sua conta.">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nova senha" error={errors.password} hint="Mínimo de 6 caracteres.">
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              placeholder="Nova senha"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>

        <Field label="Confirmar nova senha" error={errors.confirmar}>
          {(props) => (
            <PasswordInput
              {...props}
              autoComplete="new-password"
              placeholder="Repita a nova senha"
              value={form.confirmar}
              onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
            />
          )}
        </Field>

        <AuthError>{errors.api}</AuthError>

        <Button type="submit" variant="accent" size="lg" block loading={loading}>
          Atualizar senha
        </Button>
      </form>
    </AuthShell>
  )
}
