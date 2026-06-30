"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { UploadZone } from "@/components/admin/UploadZone"

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
    if (!file || !titulo) return
    setUploading(true)
    // Simulate upload to Supabase Storage
    await new Promise((r) => setTimeout(r, 1500))
    setUploading(false)
    router.push("/admin/materiais")
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Novo Material</h1>
        </div>
        <Link href="/admin/materiais" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-6 space-y-6">
        <UploadZone onFile={setFile} />

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              placeholder="Título do material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 font-mono">Matéria</label>
              <select
                value={materia}
                onChange={(e) => setMateria(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
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
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
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
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
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
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
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

          <label className="flex items-center justify-between text-xs text-muted pt-2 border-t border-[#2A2A2A]">
            <span>Recomendar pela IA (badge verde no app)</span>
            <button
              type="button"
              onClick={() => setIaRecommend(!iaRecommend)}
              className={`w-9 h-5 rounded-full transition-colors relative ${iaRecommend ? "bg-accent" : "bg-[#2A2A2A]"}`}
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
