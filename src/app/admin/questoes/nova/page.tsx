"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const materias = ["Português", "Matemática", "Direito Constitucional", "Direito Administrativo", "Informática", "Raciocínio Lógico", "História", "Geografia", "Atualidades"]
const bancas = ["CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC", "CONSULPLAN", "QUADRIX", "CESGRANRIO", "Outra"]
const areas = ["Concursos", "OAB", "Militar", "ENEM"]

export default function NovaQuestaoPage() {
  const router = useRouter()
  const [materia, setMateria] = useState("")
  const [subMateria, setSubMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [ano, setAno] = useState("")
  const [area, setArea] = useState("")
  const [incidencia, setIncidencia] = useState(50)
  const [enunciado, setEnunciado] = useState("")
  const [explicacao, setExplicacao] = useState("")
  const [alternativas, setAlternativas] = useState(["", "", "", "", ""])
  const [correta, setCorreta] = useState(0)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function validar(): string | null {
    if (!materia) return "Selecione a matéria"
    if (!enunciado.trim()) return "O enunciado é obrigatório"
    const preenchidas = alternativas.filter((a) => a.trim().length > 0)
    if (preenchidas.length < 2) return "Preencha pelo menos 2 alternativas"
    if (!alternativas[correta]?.trim()) return "A alternativa marcada como correta está vazia"
    return null
  }

  async function handleSave() {
    const erro = validar()
    if (erro) {
      toast.error(erro)
      return
    }

    setSaving(true)
    const { error } = await supabase.from("questions").insert({
      materia,
      sub_materia: subMateria || null,
      banca: banca || null,
      ano: ano ? parseInt(ano) : null,
      area_concurso: area || null,
      incidencia_pct: incidencia,
      enunciado,
      alternativas: alternativas
        .map((t, i) => ({ letter: String.fromCharCode(65 + i), text: t }))
        .filter((a) => a.text.trim().length > 0),
      resposta_correta: correta,
      explicacao: explicacao || null,
    })
    setSaving(false)

    if (error) {
      console.error("Erro ao salvar questão:", error)
      toast.error("Erro ao salvar: " + error.message)
      return
    }

    toast.success("Questão criada com sucesso")
    router.push("/admin/questoes")
    router.refresh()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Nova Questão</h1>
        <Link href="/admin/questoes" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-CARD border border-[#2A2A2A] rounded-card p-6 space-y-6">
        {/* Classificação */}
        <div>
          <div className="text-[11px] text-muted font-mono mb-3">/ CLASSIFICAÇÃO</div>
          <div className="grid grid-cols-3 gap-3">
            <select value={area} onChange={(e) => setArea(e.target.value)} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
              <option value="">Área</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={materia} onChange={(e) => setMateria(e.target.value)} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
              <option value="">Matéria</option>
              {materias.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={subMateria} onChange={(e) => setSubMateria(e.target.value)} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent" placeholder="Submatéria" />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <select value={banca} onChange={(e) => setBanca(e.target.value)} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
              <option value="">Banca</option>
              {bancas.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input value={ano} onChange={(e) => setAno(e.target.value)} className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent" placeholder="Ano" />
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={100} value={incidencia} onChange={(e) => setIncidencia(Number(e.target.value))} className="flex-1 accent-accent" />
              <span className="text-xs text-accent font-mono w-8 text-right">{incidencia}%</span>
            </div>
          </div>
        </div>

        <hr className="border-[#2A2A2A]" />

        {/* Enunciado */}
        <div>
          <div className="text-[11px] text-muted font-mono mb-3">/ ENUNCIADO</div>
          <textarea
            value={enunciado}
            onChange={(e) => setEnunciado(e.target.value)}
            rows={6}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y"
            placeholder="Digite o enunciado da questão..."
          />
          <div className="text-[11px] text-muted font-mono text-right mt-1">{enunciado.length} caracteres</div>
        </div>

        <hr className="border-[#2A2A2A]" />

        {/* Alternativas */}
        <div>
          <div className="text-[11px] text-muted font-mono mb-3">/ ALTERNATIVAS</div>
          <div className="space-y-2.5">
            {alternativas.map((alt, i) => {
              const letter = String.fromCharCode(65 + i)
              const isCorrect = correta === i
              return (
                <div
                  key={letter}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isCorrect ? "border-accent bg-accent/5" : "border-[#2A2A2A] bg-[#0D0D0D]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCorreta(i)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                      isCorrect ? "bg-accent text-black" : "bg-CARD text-muted border border-[#2A2A2A]"
                    }`}
                  >
                    {letter}
                  </button>
                  <input
                    value={alt}
                    onChange={(e) => {
                      const copy = [...alternativas]
                      copy[i] = e.target.value
                      setAlternativas(copy)
                    }}
                    className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted"
                    placeholder={`Alternativa ${letter}`}
                  />
                  {isCorrect && <span className="text-[11px] text-accent font-semibold flex-shrink-0">✓ CORRETA</span>}
                </div>
              )
            })}
          </div>
        </div>

        <hr className="border-[#2A2A2A]" />

        {/* Explicação */}
        <div>
          <div className="text-[11px] text-muted font-mono mb-3">/ EXPLICAÇÃO</div>
          <textarea
            value={explicacao}
            onChange={(e) => setExplicacao(e.target.value)}
            rows={4}
            className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y"
            placeholder="Explique a resposta da questão..."
          />
          {!explicacao && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg">
              ⚠ SEM EXPLICAÇÃO — alunos não verão feedback
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-end pt-4 border-t border-[#2A2A2A]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-accent/20 text-accent border border-accent/40 px-6 py-2.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {saving ? "SALVANDO..." : "CRIAR QUESTÃO →"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
