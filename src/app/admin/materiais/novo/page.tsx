"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { UploadZone } from "@/components/admin/UploadZone"
import { createClient } from "@/lib/supabase/client"

const materias = ["Português", "Matemática", "Direito Constitucional", "Direito Administrativo", "Informática", "Raciocínio Lógico"]
const bancas = ["CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC", "CONSULPLAN", "QUADRIX", "CESGRANRIO"]

export default function NovoMaterialPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [titulo, setTitulo] = useState("")
  const [materia, setMateria] = useState("")
  const [subMateria, setSubMateria] = useState("")
  const [banca, setBanca] = useState("")
  const [professor, setProfessor] = useState("")
  const [incidencia, setIncidencia] = useState(50)
  const [iaRecommend, setIaRecommend] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleSave() {
    if (!file) {
      toast.error("Selecione um arquivo PDF")
      return
    }
    if (!titulo.trim()) {
      toast.error("O título é obrigatório")
      return
    }

    setUploading(true)
    const supabase = createClient()
    const path = `${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from("materiais").upload(path, file)
    if (uploadError) {
      console.error("Erro ao fazer upload do PDF:", uploadError)
      toast.error("Erro ao fazer upload: " + uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from("materials").insert({
      titulo,
      materia: materia || null,
      sub_materia: subMateria || null,
      banca: banca || null,
      professor: professor || null,
      incidencia_pct: incidencia,
      ia_recommend: iaRecommend,
      pdf_url: path,
    })

    if (insertError) {
      console.error("Erro ao salvar material:", insertError)
      toast.error("Erro ao salvar: " + insertError.message)
      await supabase.storage.from("materiais").remove([path])
      setUploading(false)
      return
    }

    toast.success("Material salvo com sucesso")
    router.push("/admin/materiais")
    router.refresh()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-fg">Novo Material</h1>
        </div>
        <Link href="/admin/materiais" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-card border border-card-border rounded-card p-6 space-y-6">
        <UploadZone onFile={setFile} />

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
                {materias.map((m) => <option key={m} value={m}>{m}</option>)}
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
                {bancas.map((b) => <option key={b} value={b}>{b}</option>)}
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
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>0%</span>
              <span>Quanto esse tema cai na banca selecionada</span>
              <span>100%</span>
            </div>
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
          disabled={!file || !titulo || uploading}
          className="w-full bg-accent/20 text-accent border border-accent/40 text-sm font-semibold py-3 rounded-lg hover:bg-accent/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {uploading ? "FAZENDO UPLOAD..." : "SALVAR MATERIAL →"}
        </button>
      </div>
    </motion.div>
  )
}
