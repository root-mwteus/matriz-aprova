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
            className="w-full bg-transparent border border-white/20 text-foreground font-semibold py-3 rounded-card hover:bg-white/5 transition-all text-sm"
          >
            CONTINUAR COM GOOGLE
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
