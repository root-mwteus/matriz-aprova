"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { forgotSchema, type ForgotData } from "@/lib/auth-validation"
import { SITE_NAME } from "@/lib/constants"

export default function ForgotPasswordPage() {
  const supabase = createClient()
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

    const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      setErrors({ api: error.message })
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background bg-grid-dots bg-[length:20px_20px] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-bold tracking-wider text-foreground hover:text-accent transition-colors">
            {SITE_NAME}
          </Link>
          <p className="text-muted text-sm">Recupere sua senha</p>
        </div>

        <div className="bg-card border border-card-border rounded-card p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <div className="text-5xl mb-2">📧</div>
              <h2 className="text-lg font-bold tracking-title uppercase text-foreground">
                Email enviado!
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Enviamos um link de recuperação para{" "}
                <strong className="text-foreground">{form.email}</strong>.
                Verifique sua caixa de entrada e siga as instruções.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 bg-accent text-accent-foreground font-bold px-8 py-3 rounded-card hover:bg-accent/90 transition-all text-sm tracking-wider"
              >
                VOLTAR AO LOGIN
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-sm text-muted leading-relaxed">
                Digite seu email cadastrado e enviaremos um link para redefinir sua senha.
              </p>

              <div className="space-y-1">
                <label className="block text-sm text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              {errors.api && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-card px-4 py-2"
                >
                  {errors.api}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-accent-foreground font-bold py-3.5 rounded-card hover:bg-accent/90 transition-all disabled:opacity-50 text-sm tracking-wider"
              >
                {loading ? "ENVIANDO..." : "ENVIAR LINK"}
              </button>

              <p className="text-center text-sm text-muted">
                <Link href="/login" className="text-accent hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
