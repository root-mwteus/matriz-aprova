"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Course, Lesson, Module } from "@/types"

const tabs = ["INFORMAÇÕES", "CONTEÚDO"]
const areas = ["Concursos", "OAB", "Militar", "ENEM"]

interface ModuloComAulas extends Module {
  aulas: Lesson[]
}

function formatarDuracao(segundos: number | null) {
  if (!segundos) return "00:00"
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function parseDuracao(texto: string): number {
  const [m, s] = texto.split(":").map((v) => parseInt(v) || 0)
  return (m || 0) * 60 + (s || 0)
}

export default function CursoEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [tab, setTab] = useState("INFORMAÇÕES")
  const [loading, setLoading] = useState(true)
  const [naoEncontrado, setNaoEncontrado] = useState(false)
  const [curso, setCurso] = useState<Course | null>(null)
  const [titulo, setTitulo] = useState("")
  const [area, setArea] = useState("")
  const [descricao, setDescricao] = useState("")
  const [publicado, setPublicado] = useState(false)
  const [salvandoInfo, setSalvandoInfo] = useState(false)
  const [modulos, setModulos] = useState<ModuloComAulas[]>([])
  const [editAula, setEditAula] = useState<{ moduloId: string; aula: Lesson } | null>(null)

  useEffect(() => {
    carregar()
  }, [params.id])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()

    const { data: cursoData, error } = await supabase.from("courses").select("*").eq("id", params.id).single()
    if (error || !cursoData) {
      setNaoEncontrado(true)
      setLoading(false)
      return
    }
    setCurso(cursoData)
    setTitulo(cursoData.titulo)
    setArea(cursoData.area || areas[0])
    setDescricao(cursoData.descricao || "")
    setPublicado(cursoData.publicado)

    const { data: modulosData } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", params.id)
      .order("ordem")

    const moduloIds = (modulosData || []).map((m) => m.id)
    let aulasPorModulo: Record<string, Lesson[]> = {}
    if (moduloIds.length > 0) {
      const { data: aulasData } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", moduloIds)
        .order("ordem")
      aulasPorModulo = (aulasData || []).reduce((acc, a) => {
        acc[a.module_id] = acc[a.module_id] || []
        acc[a.module_id].push(a)
        return acc
      }, {} as Record<string, Lesson[]>)
    }

    setModulos((modulosData || []).map((m) => ({ ...m, aulas: aulasPorModulo[m.id] || [] })))
    setLoading(false)
  }

  async function salvarInformacoes() {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório")
      return
    }
    setSalvandoInfo(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("courses")
      .update({ titulo, area, descricao: descricao || null, publicado })
      .eq("id", params.id)
    setSalvandoInfo(false)

    if (error) {
      console.error("Erro ao salvar curso:", error)
      toast.error("Erro ao salvar informações")
    } else {
      toast.success("Informações salvas")
    }
  }

  async function addModulo() {
    const supabase = createClient()
    const idx = modulos.length + 1
    const { data, error } = await supabase
      .from("modules")
      .insert({ course_id: params.id, titulo: `Módulo ${String(idx).padStart(2, "0")} — Novo Módulo`, ordem: modulos.length })
      .select()
      .single()

    if (error || !data) {
      console.error("Erro ao criar módulo:", error)
      toast.error("Erro ao criar módulo")
      return
    }
    setModulos([...modulos, { ...data, aulas: [] }])
  }

  async function renomearModulo(moduloId: string, novoTitulo: string) {
    setModulos(modulos.map((m) => (m.id === moduloId ? { ...m, titulo: novoTitulo } : m)))
  }

  async function salvarTituloModulo(moduloId: string, tituloAtual: string) {
    const supabase = createClient()
    const { error } = await supabase.from("modules").update({ titulo: tituloAtual }).eq("id", moduloId)
    if (error) {
      console.error("Erro ao renomear módulo:", error)
      toast.error("Erro ao renomear módulo")
    }
  }

  async function deleteModulo(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from("modules").delete().eq("id", id)
    if (error) {
      console.error("Erro ao excluir módulo:", error)
      toast.error("Erro ao excluir módulo")
      return
    }
    setModulos(modulos.filter((m) => m.id !== id))
  }

  async function addAula(moduloId: string) {
    const modulo = modulos.find((m) => m.id === moduloId)
    if (!modulo) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("lessons")
      .insert({ module_id: moduloId, titulo: "Nova Aula", ordem: modulo.aulas.length })
      .select()
      .single()

    if (error || !data) {
      console.error("Erro ao criar aula:", error)
      toast.error("Erro ao criar aula")
      return
    }
    setModulos(modulos.map((m) => (m.id === moduloId ? { ...m, aulas: [...m.aulas, data] } : m)))
    setEditAula({ moduloId, aula: data })
  }

  async function saveAula(moduloId: string, aulaId: string, titulo: string, videoUrl: string, duracaoTexto: string) {
    const supabase = createClient()
    const duracaoSegundos = parseDuracao(duracaoTexto)
    const { error } = await supabase
      .from("lessons")
      .update({ titulo, video_url: videoUrl || null, duracao_segundos: duracaoSegundos })
      .eq("id", aulaId)

    if (error) {
      console.error("Erro ao salvar aula:", error)
      toast.error("Erro ao salvar aula")
      return
    }

    setModulos(modulos.map((m) =>
      m.id === moduloId
        ? { ...m, aulas: m.aulas.map((a) => (a.id === aulaId ? { ...a, titulo, video_url: videoUrl || null, duracao_segundos: duracaoSegundos } : a)) }
        : m
    ))
    setEditAula(null)
    toast.success("Aula salva")
  }

  async function deleteAula(moduloId: string, aulaId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("lessons").delete().eq("id", aulaId)
    if (error) {
      console.error("Erro ao excluir aula:", error)
      toast.error("Erro ao excluir aula")
      return
    }
    setModulos(modulos.map((m) => (m.id === moduloId ? { ...m, aulas: m.aulas.filter((a) => a.id !== aulaId) } : m)))
  }

  if (loading) {
    return <div className="text-muted text-sm">Carregando...</div>
  }

  if (naoEncontrado || !curso) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-title uppercase">Editar Curso</h1>
          <Link href="/admin/cursos" className="text-sm text-muted hover:text-foreground transition-colors">← VOLTAR</Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">🎓</span>
          <p className="text-sm text-muted">Curso não encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Editar Curso</h1>
        </div>
        <Link href="/admin/cursos" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      <div className="flex border-b border-[#2A2A2A] mb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-mono px-4 py-3 border-b-2 transition-colors ${
              tab === t ? "text-accent border-accent" : "text-muted border-transparent hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "INFORMAÇÕES" && (
        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Título do Curso</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Área</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
            >
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1.5 font-mono">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent resize-y"
            />
          </div>
          <div className="pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
            <label className="text-xs text-muted font-mono">Publicado</label>
            <button
              onClick={() => setPublicado(!publicado)}
              className={`w-9 h-5 rounded-full relative transition-colors ${publicado ? "bg-accent" : "bg-[#2A2A2A]"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${publicado ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="pt-4 flex justify-end">
            <button
              onClick={salvarInformacoes}
              disabled={salvandoInfo}
              className="text-xs bg-accent/20 text-accent border border-accent/40 px-6 py-2.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
            >
              {salvandoInfo ? "SALVANDO..." : "SALVAR INFORMAÇÕES →"}
            </button>
          </div>
        </div>
      )}

      {tab === "CONTEÚDO" && (
        <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-5 space-y-4">
          {modulos.map((modulo) => (
            <div key={modulo.id} className="border border-[#2A2A2A] rounded-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#2A2A2A]">
                <input
                  value={modulo.titulo}
                  onChange={(e) => renomearModulo(modulo.id, e.target.value)}
                  onBlur={(e) => salvarTituloModulo(modulo.id, e.target.value)}
                  className="bg-transparent text-sm text-foreground font-medium focus:outline-none focus:text-accent w-full"
                />
                <button onClick={() => deleteModulo(modulo.id)} className="text-muted hover:text-red-400 transition-colors flex-shrink-0 ml-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-2 space-y-1">
                {modulo.aulas.map((aula) => (
                  <div key={aula.id} className="flex items-center justify-between py-1.5 group/aula">
                    <span
                      className="text-sm text-foreground cursor-pointer hover:text-accent transition-colors"
                      onClick={() => setEditAula({ moduloId: modulo.id, aula })}
                    >
                      {aula.titulo}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted font-mono">{formatarDuracao(aula.duracao_segundos)}</span>
                      <button onClick={() => deleteAula(modulo.id, aula.id)} className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover/aula:opacity-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addAula(modulo.id)}
                  className="text-xs text-accent hover:text-accent/80 transition-colors mt-1 flex items-center gap-1"
                >
                  + ADICIONAR AULA
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addModulo}
            className="w-full text-sm text-accent border border-dashed border-accent/40 py-3 rounded-lg hover:bg-accent/5 transition-colors"
          >
            + ADICIONAR MÓDULO
          </button>
        </div>
      )}

      {/* Modal de edição de aula */}
      {editAula && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000088" }}>
          <div className="bg-CARD] border border-[#2A2A2A] rounded-card p-6 w-full max-w-md">
            <h3 className="text-foreground font-bold text-base mb-4">Editar Aula</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Título da Aula</label>
                <input
                  id="edit-aula-titulo"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  defaultValue={editAula.aula.titulo}
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">URL do Vídeo</label>
                <input
                  id="edit-aula-video"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                  defaultValue={editAula.aula.video_url || ""}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Duração</label>
                <input
                  id="edit-aula-duracao"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  defaultValue={formatarDuracao(editAula.aula.duracao_segundos)}
                  placeholder="MM:SS"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditAula(null)} className="px-4 py-2 text-sm border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors">
                CANCELAR
              </button>
              <button
                onClick={() => {
                  const tit = (document.getElementById("edit-aula-titulo") as HTMLInputElement)?.value || editAula.aula.titulo
                  const video = (document.getElementById("edit-aula-video") as HTMLInputElement)?.value || ""
                  const dur = (document.getElementById("edit-aula-duracao") as HTMLInputElement)?.value || "00:00"
                  saveAula(editAula.moduloId, editAula.aula.id, tit, video, dur)
                }}
                className="px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
              >
                SALVAR AULA
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
