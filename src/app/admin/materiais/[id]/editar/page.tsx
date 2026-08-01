"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { UploadZone } from "@/components/admin/UploadZone"
import { createClient } from "@/lib/supabase/client"
import { BANCAS, MATERIAS } from "@/lib/constants"

export default function EditarMaterialPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pdfAtual, setPdfAtual] = useState<string | null>(null)
  const [titulo, setTitulo] = useState("")
  const [materia, setMateria] = useState("")
  const [subMateria, setSubMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [professor, setProfessor] = useState("")
  const [incidencia, setIncidencia] = useState(50)
  const [iaRecommend, setIaRecommend] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase
      .from("materials")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) {
          setNaoEncontrado(true)
          setLoading(false)
          return
        }
        setTitulo(data.titulo)
        setMateria(data.materia || "")
        setSubMateria(data.sub_materia || "")
        setBanca(data.banca || "")
        setProfessor(data.professor || "")
        setIncidencia(data.incidencia_pct || 0)
        setIaRecommend(data.ia_recommend || false)
        setPdfAtual(data.pdf_url)
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [params.id])

  async function handleSave() {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório")
      return
    }

    setSaving(true)
    const supabase = createClient()
    let pdfPath = pdfAtual

    if (file) {
      const newPath = `${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from("materiais").upload(newPath, file)
      if (uploadError) {
        console.error("Erro ao fazer upload do PDF:", uploadError)
        toast.error("Erro ao fazer upload: " + uploadError.message)
        setSaving(false)
        return
      }
      if (pdfAtual) {
        await supabase.storage.from("materiais").remove([pdfAtual])
      }
      pdfPath = newPath
    }

    const { error } = await supabase
      .from("materials")
      .update({
        titulo,
        materia: materia || null,
        sub_materia: subMateria || null,
        banca: banca || null,
        professor: professor || null,
        incidencia_pct: incidencia,
        ia_recommend: iaRecommend,
        pdf_url: pdfPath,
      })
      .eq("id", params.id)
    setSaving(false)

    if (error) {
      console.error("Erro ao atualizar material:", error)
      toast.error("Erro ao salvar: " + error.message)
      return
    }

    toast.success("Material atualizado com sucesso")
    router.push("/admin/materiais")
    router.refresh()
  }

  if (loading) {
    return <div className="text-muted text-sm">Carregando...</div>
  }

  if (naoEncontrado) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-fg">Editar Material</h1>
          <Link href="/admin/materiais" className="text-sm text-muted hover:text-foreground transition-colors">← VOLTAR</Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">📄</span>
          <p className="text-sm text-muted">Material não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-fg">Editar Material</h1>
        </div>
        <Link href="/admin/materiais" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-card border border-card-border rounded-card p-6 space-y-6">
        <div>
          <div className="text-[11px] text-muted font-mono mb-2">{pdfAtual ? "Substituir PDF (opcional)" : "Anexar PDF"}</div>
          <UploadZone onFile={setFile} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="field h-10"
              placeholder="Título do material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono">Matéria</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="field h-10"
              >
                <option value="">Selecione</option>
                {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono">Submatéria</label>
              <input
                value={subMateria}
                onChange={(e) => setSubMateria(e.target.value)}
                className="field h-10"
                placeholder="Ex: Princípios"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono">Banca</label>
              <select
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                className="field h-10"
              >
                <option value="">Selecione</option>
                {BANCAS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono">Professor</label>
              <input
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="field h-10"
                placeholder="Nome do professor"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">
              Incidência na banca: <span className="text-accent">{incidencia}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={incidencia}
              onChange={(e) => setIncidencia(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <label className="flex items-center justify-between text-xs text-muted pt-2 border-t border-card-border">
            <span>Recomendar pela IA (badge verde no app)</span>
            <button
              type="button"
              onClick={() => setIaRecommend(!iaRecommend)}
              className={`w-9 h-5 rounded-full transition-colors relative ${iaRecommend ? "bg-accent" : "bg-card-border"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${iaRecommend ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-accent/20 text-accent border border-accent/40 text-sm font-semibold py-3 rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando…" : "SALVAR ALTERAÇÕES →"}
        </button>
      </div>
    </motion.div>
  )
}
