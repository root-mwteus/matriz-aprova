"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Course } from "@/types"

const areas = ["Concursos", "OAB", "Militar", "ENEM"]

interface CursoRow extends Course {
  total_modulos: number
  total_aulas: number
  total_minutos: number
}

export default function AdminCursosPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<CursoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [criando, setCriando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState("")
  const [novaArea, setNovaArea] = useState(areas[0])
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const supabase = createClient()
    const { data: cursosData, error } = await supabase.from("courses").select("*").order("ordem")

    if (error) {
      console.error("Erro ao carregar cursos:", error)
      toast.error("Erro ao carregar cursos")
      setLoading(false)
      return
    }

    const lista = cursosData || []
    const ids = lista.map((c) => c.id)

    let modulosPorCurso: Record<string, { id: string }[]> = {}
    if (ids.length > 0) {
      const { data: modulos } = await supabase.from("modules").select("id, course_id").in("course_id", ids)
      modulosPorCurso = (modulos || []).reduce((acc, m) => {
        acc[m.course_id] = acc[m.course_id] || []
        acc[m.course_id].push({ id: m.id })
        return acc
      }, {} as Record<string, { id: string }[]>)
    }

    const moduloIds = Object.values(modulosPorCurso).flat().map((m) => m.id)
    let aulasPorModulo: Record<string, { duracao_segundos: number | null }[]> = {}
    if (moduloIds.length > 0) {
      const { data: aulas } = await supabase.from("lessons").select("module_id, duracao_segundos").in("module_id", moduloIds)
      aulasPorModulo = (aulas || []).reduce((acc, a) => {
        acc[a.module_id] = acc[a.module_id] || []
        acc[a.module_id].push({ duracao_segundos: a.duracao_segundos })
        return acc
      }, {} as Record<string, { duracao_segundos: number | null }[]>)
    }

    const enriquecidos: CursoRow[] = lista.map((c) => {
      const modulos = modulosPorCurso[c.id] || []
      const aulas = modulos.flatMap((m) => aulasPorModulo[m.id] || [])
      const minutos = Math.round(aulas.reduce((s, a) => s + (a.duracao_segundos || 0), 0) / 60)
      return { ...c, total_modulos: modulos.length, total_aulas: aulas.length, total_minutos: minutos }
    })

    setCursos(enriquecidos)
    setLoading(false)
  }

  async function togglePublicado(curso: CursoRow) {
    const supabase = createClient()
    const { error } = await supabase.from("courses").update({ publicado: !curso.publicado }).eq("id", curso.id)
    if (error) {
      console.error("Erro ao atualizar curso:", error)
      toast.error("Erro ao atualizar status do curso")
    } else {
      setCursos((prev) => prev.map((c) => (c.id === curso.id ? { ...c, publicado: !c.publicado } : c)))
    }
  }

  async function criarCurso() {
    if (!novoTitulo.trim()) {
      toast.error("Informe um título para o curso")
      return
    }
    setSalvando(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("courses")
      .insert({ titulo: novoTitulo, area: novaArea, ordem: cursos.length })
      .select()
      .single()
    setSalvando(false)

    if (error || !data) {
      console.error("Erro ao criar curso:", error)
      toast.error("Erro ao criar curso")
      return
    }

    toast.success("Curso criado")
    setCriando(false)
    setNovoTitulo("")
    router.push(`/admin/cursos/${data.id}`)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Cursos</h1>
          <span className="text-xs text-muted font-mono">{cursos.length}</span>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-1.5 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
        >
          NOVO CURSO →
        </button>
      </div>

      {loading ? (
        <div className="text-muted text-sm">Carregando...</div>
      ) : cursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-card-border rounded-card">
          <span className="text-5xl mb-4">🎓</span>
          <p className="text-sm text-muted">Nenhum curso cadastrado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cursos.map((curso, idx) => (
            <motion.div
              key={curso.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card overflow-hidden group hover:border-accent/30 transition-colors"
            >
              <div className="h-32 bg-gradient-to-br from-[#CBFF4D20] to-[#111111] flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-accent/20 text-accent text-lg font-bold flex items-center justify-center">
                  {curso.titulo[0]}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-sm text-foreground font-medium leading-tight">{curso.titulo}</div>
                  {curso.area && <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-1.5 inline-block">{curso.area}</span>}
                </div>
                <div className="text-xs text-muted font-mono">
                  {curso.total_modulos} módulos · {curso.total_aulas} aulas · {curso.total_minutos}min
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2A2A2A]">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    curso.publicado
                      ? "text-green-400 bg-green-400/10 border border-green-400/30"
                      : "text-muted bg-[#2A2A2A]/50 border border-[#2A2A2A]"
                  }`}>
                    {curso.publicado ? "PUBLICADO" : "RASCUNHO"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/cursos/${curso.id}`}
                      className="text-[11px] text-accent hover:underline font-medium"
                    >
                      EDITAR
                    </Link>
                    <button onClick={() => togglePublicado(curso)} className="text-[11px] text-muted hover:text-foreground">
                      {curso.publicado ? "DESPUBLICAR" : "PUBLICAR"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {criando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "#00000088" }}>
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-card p-6 w-full max-w-md">
            <h3 className="text-foreground font-bold text-base mb-4">Novo Curso</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Título</label>
                <input
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                  placeholder="Título do curso"
                />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5 font-mono">Área</label>
                <select
                  value={novaArea}
                  onChange={(e) => setNovaArea(e.target.value)}
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCriando(false)} className="px-4 py-2 text-sm border border-[#2A2A2A] rounded-lg text-muted hover:text-foreground transition-colors">
                CANCELAR
              </button>
              <button
                onClick={criarCurso}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/40 rounded-lg font-semibold hover:bg-accent/30 transition-colors disabled:opacity-50"
              >
                {salvando ? "CRIANDO..." : "CRIAR CURSO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
