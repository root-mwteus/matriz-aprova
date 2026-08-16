"use client"

import { useState } from "react"
import Link from "next/link"
import { MailCheck } from "lucide-react"
import { forgotSchema, type ForgotData } from "@/lib/auth-validation"
import { AuthError, AuthShell } from "@/components/auth/AuthShell"
import { Button, Field, Input } from "@/components/ui"

/**
 * Recuperação de senha.
 *
 * O estado de sucesso confirma sem afirmar que a conta existe: "se houver
 * uma conta com esse e-mail". A versão anterior dizia "Enviamos um link
 * para X", o que transformava a tela num verificador de cadastros.
 */
export default function ForgotPasswordPage() {
  const [form, setForm] = useState<ForgotData>({ email: "" })
  const [errors, setErrors] = useState<Partial<Record<keyof ForgotData | "api", string>>>({})
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const result = forgotSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ForgotData, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ForgotData
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})

    const res = await fetch("/api/auth/recuperar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email }),
    })

    if (!res.ok) {
      setErrors({ api: "Não foi possível enviar o link agora. Tente novamente em instantes." })
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthShell title="Verifique seu e-mail">
        <div className="flex flex-col items-center py-2 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-positive-soft text-positive">
            <MailCheck size={18} strokeWidth={1.75} />
          </span>

          <p className="mt-4 text-base text-fg-muted">
            Se houver uma conta com <strong className="font-medium text-fg">{form.email}</strong>,
            o link de redefinição chega em alguns minutos.
          </p>

          <p className="mt-2 text-sm text-fg-subtle">
            Não recebeu? Confira a caixa de spam antes de tentar de novo.
          </p>

          <div className="mt-6 flex w-full flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-fg-on-accent shadow-xs transition-colors duration-fast hover:bg-accent-hover"
            >
              Voltar ao login
            </Link>
            <Button variant="ghost" size="lg" block onClick={() => setSent(false)}>
              Usar outro e-mail
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Recuperar senha"
      description="Enviaremos um link para você criar uma senha nova."
      footer={
        <Link href="/login" className="font-medium text-accent-ink hover:underline">
          Voltar ao login
        </Link>
      }
    >
      <form onSubmit={handleReset} className="space-y-4" noValidate>
        <Field label="E-mail cadastrado" error={errors.email}>
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

        <AuthError>{errors.api}</AuthError>

        <Button type="submit" variant="accent" size="lg" block loading={loading}>
          Enviar link
        </Button>
      </form>
    </AuthShell>
  )
}
