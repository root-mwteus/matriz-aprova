"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { registerSchema, type RegisterData } from "@/lib/auth-validation"
import { SITE_NAME } from "@/lib/constants"

const areas = [
  { value: "", label: "Selecione sua área" },
  { value: "Concursos Gerais", label: "Concursos Gerais" },
  { value: "OAB", label: "OAB" },
  { value: "Militar", label: "Militar" },
  { value: "ENEM", label: "ENEM" },
]

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

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { nome: form.nome, area_concurso: form.area_concurso },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

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

    // Envia email de boas-vindas (non-blocking — não bloqueia o redirect se falhar)
    fetch("/api/email/boas-vindas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: form.nome, email: form.email, area: form.area_concurso }),
    }).catch(() => {})

    router.push("/onboarding")
    router.refresh()
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setErrors({ api: "Erro ao autenticar com Google" })
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
          <p className="text-muted text-sm">Crie sua conta e comece a estudar</p>
        </div>

        <div className="bg-card border border-card-border rounded-card p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm text-muted">Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                placeholder="Seu nome"
              />
              {errors.nome && <p className="text-xs text-red-400">{errors.nome}</p>}
            </div>

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

            <div className="space-y-1">
              <label className="block text-sm text-muted">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-muted">Área de concurso</label>
              <select
                value={form.area_concurso}
                onChange={(e) => setForm({ ...form, area_concurso: e.target.value })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors appearance-none"
              >
                {areas.map((a) => (
                  <option key={a.value} value={a.value} disabled={a.value === ""}>
                    {a.label}
                  </option>
                ))}
              </select>
              {errors.area_concurso && <p className="text-xs text-red-400">{errors.area_concurso}</p>}
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
              {loading ? "CRIANDO CONTA..." : "CRIAR CONTA →"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full bg-transparent border border-white/20 text-foreground font-semibold py-3 rounded-card hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </div>

        <p className="text-center text-sm text-muted">
          Já tem conta?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
