"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { UploadZone } from "@/components/admin/UploadZone"
import { createClient } from "@/lib/supabase/client"

const ETAPAS = [
  "Enviando PDF...",
  "Lendo a prova com IA (pode levar até 1 min)...",
  "Estruturando questões...",
]

export default function ImportarPdfPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [processando, setProcessando] = useState(false)
  const [etapa, setEtapa] = useState(0)

  async function handleExtrair() {
    if (!file) {
      toast.error("Selecione um PDF primeiro")
      return
    }
    if (file.type !== "application/pdf") {
      toast.error("O arquivo precisa ser um PDF")
      return
    }

    setProcessando(true)
    setEtapa(0)
    const supabase = createClient()
    const path = `${crypto.randomUUID()}.pdf`

    // 1. Upload do PDF para o bucket temporário
    const { error: uploadError } = await supabase.storage.from("pdf-provas").upload(path, file)
    if (uploadError) {
      toast.error("Erro ao enviar PDF: " + uploadError.message)
      setProcessando(false)
      return
    }

    // 2. Dispara a extração via IA
    setEtapa(1)
    let questoes
    try {
      const res = await fetch("/api/admin/extrair-questoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdf_path: path }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erro ao extrair questões")
        await supabase.storage.from("pdf-provas").remove([path])
        setProcessando(false)
        return
      }
      questoes = json.questoes
    } catch (err) {
      console.error(err)
      toast.error("Falha na comunicação com o servidor")
      await supabase.storage.from("pdf-provas").remove([path])
      setProcessando(false)
      return
    }

    // 3. PDF já não é mais necessário — descarta
    setEtapa(2)
    await supabase.storage.from("pdf-provas").remove([path])

    if (!questoes || questoes.length === 0) {
      toast.error("Nenhuma questão foi identificada neste PDF")
      setProcessando(false)
      return
    }

    // Passa o resultado para a tela de revisão via sessionStorage
    sessionStorage.setItem("questoes_extraidas", JSON.stringify(questoes))
    toast.success(`${questoes.length} questões extraídas`)
    router.push("/admin/questoes/importar-pdf/revisar")
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Importar Prova (PDF)</h1>
        <Link href="/admin/questoes" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="bg-card border border-[#2A2A2A] rounded-card p-6 space-y-5">
        <p className="text-sm text-muted">
          Envie o PDF de uma prova e a IA vai extrair automaticamente as questões, alternativas,
          gabarito comentado e fórmulas (em LaTeX). Você revisa tudo antes de salvar.
        </p>

        <UploadZone onFile={setFile} accept=".pdf" />

        {processando ? (
          <div className="space-y-2">
            {ETAPAS.map((txt, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm ${
                  i === etapa ? "text-accent" : i < etapa ? "text-muted" : "text-muted/40"
                }`}
              >
                <span>{i < etapa ? "✓" : i === etapa ? "⋯" : "○"}</span>
                {txt}
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={handleExtrair}
            disabled={!file}
            className="w-full text-sm bg-accent text-accent-foreground font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            EXTRAIR QUESTÕES →
          </button>
        )}

        <div className="text-[11px] text-muted bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg p-3 space-y-1">
          <p>• A extração de texto e fórmulas é automática.</p>
          <p>• Figuras/gráficos são <span className="text-foreground">detectados</span>, mas a imagem real precisa ser anexada por você na revisão.</p>
          <p>• Nada é salvo no banco até você confirmar na próxima tela.</p>
        </div>
      </div>
    </motion.div>
  )
}
