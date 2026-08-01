"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { ANOS, AREAS, BANCAS, MATERIAS } from "@/lib/constants"
import type { Question } from "@/types"

const LETRAS = ["A", "B", "C", "D", "E"]

interface FormState {
  materia: string
  sub_materia: string
  banca: string
  ano: string
  area_concurso: string
  nivel: string
  enunciado: string
  texto_referencia: string
  mostrar_texto: boolean
  alternativas: string[]
  resposta_correta: number
  explicacao: string
  referencias: string
}

const FORM_VAZIO: FormState = {
  materia: "",
  sub_materia: "",
  banca: "",
  ano: "",
  area_concurso: "",
  nivel: "",
  enunciado: "",
  texto_referencia: "",
  mostrar_texto: false,
  alternativas: ["", "", "", "", ""],
  resposta_correta: 0,
  explicacao: "",
  referencias: "",
}

function paraForm(q: Question): FormState {
  return {
    materia: q.materia,
    sub_materia: q.sub_materia ?? "",
    banca: q.banca ?? "",
    ano: q.ano ? String(q.ano) : "",
    area_concurso: q.area_concurso ?? "",
    nivel: q.nivel ?? "",
    enunciado: q.enunciado,
    texto_referencia: q.texto_referencia ?? "",
    mostrar_texto: q.mostrar_texto,
    alternativas: LETRAS.map((_, i) => q.alternativas[i]?.text ?? ""),
    resposta_correta: q.resposta_correta,
    explicacao: q.explicacao ?? "",
    referencias: q.referencias ?? "",
  }
}

export function QuestaoForm({ questionId }: { questionId?: string }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(!!questionId)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState<FormState>(FORM_VAZIO)

  useEffect(() => {
    if (!questionId) return
    let ativo = true
    const supabase = createClient()
    supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single()
      .then(({ data, error }) => {
        if (!ativo) return
        if (error || !data) {
          toast.error("Questão não encontrada")
          router.push("/admin/questoes")
          return
        }
        setForm(paraForm(data as Question))
        setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [questionId, router])

  function set(campo: Partial<FormState>) {
    setForm((atual) => ({ ...atual, ...campo }))
  }

  function setAlternativa(i: number, texto: string) {
    setForm((atual) => {
      const alternativas = [...atual.alternativas]
      alternativas[i] = texto
      return { ...atual, alternativas }
    })
  }

  async function salvar() {
    if (!form.materia) {
      toast.error("Escolha a matéria")
      return
    }
    if (!form.enunciado.trim()) {
      toast.error("O enunciado é obrigatório")
      return
    }
    if (form.alternativas.some((a) => !a.trim())) {
      toast.error("Todas as alternativas precisam de texto")
      return
    }

    const payload = {
      materia: form.materia,
      sub_materia: form.sub_materia.trim() || null,
      banca: form.banca || null,
      ano: form.ano ? Number(form.ano) : null,
      area_concurso: form.area_concurso || null,
      nivel: (form.nivel || null) as Question["nivel"],
      enunciado: form.enunciado.trim(),
      texto_referencia: form.texto_referencia.trim() || null,
      mostrar_texto: form.mostrar_texto,
      alternativas: form.alternativas.map((texto, i) => ({
        letter: LETRAS[i],
        text: texto.trim(),
      })),
      resposta_correta: form.resposta_correta,
      explicacao: form.explicacao.trim() || null,
      referencias: form.referencias.trim() || null,
    }

    setSalvando(true)
    const supabase = createClient()
    const { error } = questionId
      ? await supabase.from("questions").update(payload).eq("id", questionId)
      : await supabase.from("questions").insert(payload)
    setSalvando(false)

    if (error) {
      console.error("Erro ao salvar questão:", error)
      toast.error("Erro ao salvar questão: " + error.message)
      return
    }

    toast.success(questionId ? "Questão atualizada" : "Questão criada")
    router.push("/admin/questoes")
  }

  if (carregando) {
    return <div className="text-muted text-sm">Carregando...</div>
  }

  return (
    <div className="bg-card border border-card-border rounded-card p-6 max-w-3xl space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Matéria *</label>
          <select value={form.materia} onChange={(e) => set({ materia: e.target.value })} className="field h-10">
            <option value="">Selecione</option>
            {MATERIAS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Sub-matéria</label>
          <input
            value={form.sub_materia}
            onChange={(e) => set({ sub_materia: e.target.value })}
            className="field h-10"
            placeholder="Ex: Concordância verbal"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Banca</label>
          <select value={form.banca} onChange={(e) => set({ banca: e.target.value })} className="field h-10">
            <option value="">Selecione</option>
            {BANCAS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Ano</label>
          <select value={form.ano} onChange={(e) => set({ ano: e.target.value })} className="field h-10">
            <option value="">Selecione</option>
            {ANOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Área</label>
          <select value={form.area_concurso} onChange={(e) => set({ area_concurso: e.target.value })} className="field h-10">
            <option value="">Selecione</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1.5 font-mono">Nível</label>
          <select value={form.nivel} onChange={(e) => set({ nivel: e.target.value })} className="field h-10">
            <option value="">Selecione</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5 font-mono">Enunciado *</label>
        <textarea
          value={form.enunciado}
          onChange={(e) => set({ enunciado: e.target.value })}
          rows={4}
          className="field py-2.5"
          placeholder="Digite o enunciado da questão"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5 font-mono">Texto de apoio</label>
        <textarea
          value={form.texto_referencia}
          onChange={(e) => set({ texto_referencia: e.target.value })}
          rows={3}
          className="field py-2.5"
          placeholder="Texto de referência (opcional)"
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={form.mostrar_texto}
            onChange={(e) => set({ mostrar_texto: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Exibir texto de apoio junto com a questão
        </label>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs text-muted mb-1.5 font-mono">Alternativas *</p>
        {LETRAS.map((letra, i) => (
          <div key={letra} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set({ resposta_correta: i })}
              title={form.resposta_correta === i ? "Correta" : "Marcar como correta"}
              className={`h-8 w-8 shrink-0 rounded-lg border text-xs font-bold transition-colors ${
                form.resposta_correta === i
                  ? "border-accent bg-accent text-black"
                  : "border-card-border text-muted hover:border-accent/50"
              }`}
            >
              {letra}
            </button>
            <input
              value={form.alternativas[i]}
              onChange={(e) => setAlternativa(i, e.target.value)}
              className="field h-10 flex-1"
              placeholder={`Alternativa ${letra}`}
            />
          </div>
        ))}
        <p className="text-[11px] text-muted pt-1">Clique na letra para marcar a resposta correta.</p>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5 font-mono">Gabarito comentado</label>
        <textarea
          value={form.explicacao}
          onChange={(e) => set({ explicacao: e.target.value })}
          rows={4}
          className="field py-2.5"
          placeholder="Explicação da resposta (opcional)"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1.5 font-mono">Referências</label>
        <input
          value={form.referencias}
          onChange={(e) => set({ referencias: e.target.value })}
          className="field h-10"
          placeholder="Links ou fontes (opcional)"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={() => router.push("/admin/questoes")}
          className="px-4 py-2 text-sm border border-card-border rounded-lg text-muted hover:text-foreground transition-colors"
        >
          CANCELAR
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          {salvando ? "Salvando…" : questionId ? "SALVAR ALTERAÇÕES" : "CRIAR QUESTÃO"}
        </button>
      </div>
    </div>
  )
}
