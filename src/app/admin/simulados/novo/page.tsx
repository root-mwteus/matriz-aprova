"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function NovoSimuladoPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    time_limit_minutes: 120,
    question_count: 10,
    filters: {
      subject_id: "",
      bank: "",
      level: "",
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from("simulados").insert({
      title: form.title,
      description: form.description || null,
      time_limit_minutes: form.time_limit_minutes,
      question_count: form.question_count,
      questions: [],
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })

    if (error) {
      toast.error("Erro ao criar simulado: " + error.message)
      setSaving(false)
      return
    }
    
    toast.success("Simulado criado com sucesso!")

    router.push("/admin/simulados")
    router.refresh()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-title uppercase">Novo Simulado</h1>
          <p className="text-sm text-muted mt-1">Configure o simulado</p>
        </div>
        <Link
          href="/admin/simulados"
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          ← VOLTAR
        </Link>
      </div>

      <form onSubmit={handleSave} className="bg-card border border-card-border rounded-card p-6 space-y-6">
        <div>
          <label className="block text-sm text-muted mb-2">Título do Simulado</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
            placeholder="Ex: Simulado Completo - Direito Constitucional"
          />
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">Descrição (opcional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors resize-y"
            placeholder="Descreva o simulado..."
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-muted mb-2">Tempo Limite (minutos)</label>
            <input
              type="number"
              value={form.time_limit_minutes}
              onChange={(e) => setForm({ ...form, time_limit_minutes: parseInt(e.target.value) })}
              min={1}
              required
              className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">Quantidade de Questões</label>
            <input
              type="number"
              value={form.question_count}
              onChange={(e) => setForm({ ...form, question_count: parseInt(e.target.value) })}
              min={1}
              max={100}
              required
              className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground uppercase mb-3">Filtros para Seleção de Questões</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted mb-2">Matéria</label>
              <select
                value={form.filters.subject_id}
                onChange={(e) => setForm({ ...form, filters: { ...form.filters, subject_id: e.target.value } })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Todas</option>
                <option value="português">Português</option>
                <option value="matemática">Matemática</option>
                <option value="direito-constitucional">Direito Constitucional</option>
                <option value="direito-administrativo">Direito Administrativo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Banca</label>
              <select
                value={form.filters.bank}
                onChange={(e) => setForm({ ...form, filters: { ...form.filters, bank: e.target.value } })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Todas</option>
                <option value="CESPE/CEBRASPE">CESPE/CEBRASPE</option>
                <option value="FGV">FGV</option>
                <option value="VUNESP">VUNESP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted mb-2">Nível</label>
              <select
                value={form.filters.level}
                onChange={(e) => setForm({ ...form, filters: { ...form.filters, level: e.target.value } })}
                className="w-full bg-background border border-card-border rounded-card px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
              >
                <option value="">Todos</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-card-border">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-accent-foreground font-bold px-8 py-3 rounded-card hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "CRIANDO..." : "CRIAR SIMULADO"}
          </button>
          <Link
            href="/admin/simulados"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
