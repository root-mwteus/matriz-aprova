"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { QuestaoFigura } from "@/types"

export const MATERIAS = ["Português", "Matemática", "Direito Constitucional", "Direito Administrativo", "Informática", "Raciocínio Lógico", "História", "Geografia", "Atualidades"]
export const BANCAS = ["CESPE/CEBRASPE", "FGV", "VUNESP", "FCC", "IBFC", "CONSULPLAN", "QUADRIX", "CESGRANRIO", "Outra"]
export const AREAS = ["Concursos", "OAB", "Militar", "ENEM"]

export interface QuestaoDraft {
  materia: string
  subMateria: string
  banca: string
  ano: string
  area: string
  incidencia: number
  enunciado: string
  textoReferencia: string
  mostrarTexto: boolean
  explicacao: string
  referencias: string
  alternativas: string[]
  correta: number
  figuras: QuestaoFigura[]
}

export function emptyDraft(): QuestaoDraft {
  return {
    materia: "",
    subMateria: "",
    banca: "",
    ano: "",
    area: "",
    incidencia: 50,
    enunciado: "",
    textoReferencia: "",
    mostrarTexto: true,
    explicacao: "",
    referencias: "",
    alternativas: ["", "", "", "", ""],
    correta: 0,
    figuras: [],
  }
}

export function validarDraft(d: QuestaoDraft): string | null {
  if (!d.materia) return "Selecione a matéria"
  if (!d.enunciado.trim()) return "O enunciado é obrigatório"
  const preenchidas = d.alternativas.filter((a) => a.trim().length > 0)
  if (preenchidas.length < 2) return "Preencha pelo menos 2 alternativas"
  if (!d.alternativas[d.correta]?.trim()) return "A alternativa marcada como correta está vazia"
  return null
}

/** Sobe um Blob (ex.: recorte do PDF) para o bucket de figuras. */
export async function uploadFiguraBlob(blob: Blob): Promise<QuestaoFigura> {
  const supabase = createClient()
  const id = crypto.randomUUID()
  const path = `${id}.png`
  const { error } = await supabase.storage
    .from("questoes-figuras")
    .upload(path, blob, { contentType: "image/png" })
  if (error) throw error
  return { id, storage_path: path, legenda: "" }
}

/** Converte um draft no formato da linha da tabela `questions`. */
export function draftToRow(d: QuestaoDraft) {
  return {
    materia: d.materia,
    sub_materia: d.subMateria || null,
    banca: d.banca || null,
    ano: d.ano ? parseInt(d.ano) : null,
    area_concurso: d.area || null,
    incidencia_pct: d.incidencia,
    enunciado: d.enunciado,
    texto_referencia: d.textoReferencia.trim() || null,
    mostrar_texto: d.mostrarTexto,
    alternativas: d.alternativas
      .map((t, i) => ({ letter: String.fromCharCode(65 + i), text: t }))
      .filter((a) => a.text.trim().length > 0),
    resposta_correta: d.correta,
    explicacao: d.explicacao || null,
    referencias: d.referencias || null,
    figuras: d.figuras.map(({ id, storage_path, legenda }) => ({
      id,
      storage_path,
      legenda: legenda || undefined,
    })),
  }
}

interface Props {
  value: QuestaoDraft
  onChange: (d: QuestaoDraft) => void
  /** Dica textual de figuras detectadas pela IA (extrator de PDF). */
  figurasDescricao?: string[]
  /**
   * Quando presente, mostra o botão "recortar do PDF" (contexto de importação).
   * Se receber um `figuraId`, o recorte deve SUBSTITUIR aquela figura (ajuste).
   */
  onCropFromPdf?: (figuraId?: string) => void
}

export function QuestaoForm({ value, onChange, figurasDescricao, onCropFromPdf }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFigura, setUploadingFigura] = useState(false)
  const supabase = createClient()

  const set = <K extends keyof QuestaoDraft>(key: K, v: QuestaoDraft[K]) =>
    onChange({ ...value, [key]: v })

  async function handleUploadFigura(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem")
      return
    }
    setUploadingFigura(true)
    const ext = file.name.split(".").pop()
    const id = crypto.randomUUID()
    const path = `${id}.${ext}`
    const { error } = await supabase.storage.from("questoes-figuras").upload(path, file)
    if (error) {
      toast.error("Erro ao fazer upload da figura: " + error.message)
      setUploadingFigura(false)
      return
    }
    set("figuras", [...value.figuras, { id, storage_path: path, legenda: "" }])
    setUploadingFigura(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function removerFigura(figura: QuestaoFigura) {
    await supabase.storage.from("questoes-figuras").remove([figura.storage_path])
    set("figuras", value.figuras.filter((f) => f.id !== figura.id))
  }

  function atualizarLegenda(id: string, legenda: string) {
    set("figuras", value.figuras.map((f) => (f.id === id ? { ...f, legenda } : f)))
  }

  return (
    <div className="space-y-6">
      {/* Classificação */}
      <div>
        <div className="text-[11px] text-muted font-mono mb-3">/ CLASSIFICAÇÃO</div>
        <div className="grid grid-cols-3 gap-3">
          <select value={value.area} onChange={(e) => set("area", e.target.value)} className="bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
            <option value="">Área</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={value.materia} onChange={(e) => set("materia", e.target.value)} className="bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
            <option value="">Matéria *</option>
            {MATERIAS.map((m) => <option key={m} value={m}>{m}</option>)}
            {value.materia && !MATERIAS.includes(value.materia) && <option value={value.materia}>{value.materia}</option>}
          </select>
          <input value={value.subMateria} onChange={(e) => set("subMateria", e.target.value)} className="bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent" placeholder="Submatéria" />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <select value={value.banca} onChange={(e) => set("banca", e.target.value)} className="bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent">
            <option value="">Banca</option>
            {BANCAS.map((b) => <option key={b} value={b}>{b}</option>)}
            {value.banca && !BANCAS.includes(value.banca) && <option value={value.banca}>{value.banca}</option>}
          </select>
          <input value={value.ano} onChange={(e) => set("ano", e.target.value)} className="bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent" placeholder="Ano" />
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} value={value.incidencia} onChange={(e) => set("incidencia", Number(e.target.value))} className="flex-1 accent-accent" />
            <span className="text-xs text-accent font-mono w-8 text-right">{value.incidencia}%</span>
          </div>
        </div>
      </div>

      <hr className="border-card-border" />

      {/* Figuras */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] text-muted font-mono">/ FIGURAS</div>
          <div className="flex items-center gap-2">
            {onCropFromPdf && (
              <button
                type="button"
                onClick={() => onCropFromPdf()}
                className="text-[11px] text-accent border border-accent/40 px-3 py-1.5 rounded-lg hover:bg-accent/10 transition-colors"
              >
                ✂ RECORTAR DO PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFigura}
              className="text-[11px] text-accent border border-accent/40 px-3 py-1.5 rounded-lg hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {uploadingFigura ? "ENVIANDO..." : "+ ADICIONAR IMAGEM"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadFigura} />
          </div>
        </div>

        {figurasDescricao && figurasDescricao.length > 0 && (
          <div className="mb-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 space-y-1">
            <div className="text-[11px] text-yellow-400 font-mono">🖼 A IA detectou figura(s) nesta questão — faça upload da imagem real:</div>
            {figurasDescricao.map((desc, i) => (
              <p key={i} className="text-xs text-foreground/80">• {desc}</p>
            ))}
          </div>
        )}

        {value.figuras.length > 0 && (
          <div className="space-y-3">
            {value.figuras.map((fig) => {
              const { data } = supabase.storage.from("questoes-figuras").getPublicUrl(fig.storage_path)
              return (
                <div key={fig.id} className="flex items-start gap-3 bg-background border border-card-border rounded-lg p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.publicUrl} alt="" className="w-24 h-16 object-contain bg-white rounded flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <input
                      value={fig.legenda || ""}
                      onChange={(e) => atualizarLegenda(fig.id, e.target.value)}
                      placeholder="Legenda (opcional)"
                      className="w-full bg-transparent text-xs text-foreground placeholder:text-muted focus:outline-none border-b border-card-border pb-1"
                    />
                    <p className="text-[10px] text-muted mt-1 font-mono truncate">{fig.storage_path}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {onCropFromPdf && (
                      <button type="button" onClick={() => onCropFromPdf(fig.id)} className="text-accent hover:text-accent/80 text-[11px]">
                        ✂ AJUSTAR
                      </button>
                    )}
                    <button type="button" onClick={() => removerFigura(fig)} className="text-red-400 hover:text-red-300 text-[11px]">
                      REMOVER
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <hr className="border-card-border" />

      {/* Texto de referência */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] text-muted font-mono">/ TEXTO DE REFERÊNCIA (OPCIONAL)</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[11px] text-muted">Exibir ao aluno</span>
            <button
              type="button"
              onClick={() => set("mostrarTexto", !value.mostrarTexto)}
              className={`relative w-9 h-5 rounded-full transition-colors ${value.mostrarTexto ? "bg-accent" : "bg-card-border"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value.mostrarTexto ? "translate-x-4" : ""}`} />
            </button>
          </label>
        </div>
        <textarea
          value={value.textoReferencia}
          onChange={(e) => set("textoReferencia", e.target.value)}
          rows={value.textoReferencia ? 6 : 2}
          className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y font-mono"
          placeholder="Texto-base / motivador (crônica, poema, artigo, trecho de lei...). Deixe vazio se a questão não depende de um texto."
        />
        {value.textoReferencia && !value.mostrarTexto && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-muted bg-background border border-card-border px-3 py-1.5 rounded-lg">
            👁 Texto salvo, mas oculto para o aluno
          </div>
        )}
      </div>

      <hr className="border-card-border" />

      {/* Enunciado */}
      <div>
        <div className="text-[11px] text-muted font-mono mb-3">/ ENUNCIADO</div>
        <textarea
          value={value.enunciado}
          onChange={(e) => set("enunciado", e.target.value)}
          rows={6}
          className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y font-mono"
          placeholder="Digite o enunciado... Use $...$ para LaTeX inline e $$...$$ para display."
        />
        <div className="text-[11px] text-muted font-mono text-right mt-1">{value.enunciado.length} chars</div>
      </div>

      <hr className="border-card-border" />

      {/* Alternativas */}
      <div>
        <div className="text-[11px] text-muted font-mono mb-3">/ ALTERNATIVAS</div>
        <div className="space-y-2.5">
          {value.alternativas.map((alt, i) => {
            const letter = String.fromCharCode(65 + i)
            const isCorrect = value.correta === i
            return (
              <div
                key={letter}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isCorrect ? "border-accent bg-accent/5" : "border-card-border bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => set("correta", i)}
                  className={`flex-shrink-0 w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                    isCorrect ? "bg-accent text-black" : "bg-card text-muted border border-card-border"
                  }`}
                >
                  {letter}
                </button>
                <input
                  value={alt}
                  onChange={(e) => {
                    const copy = [...value.alternativas]
                    copy[i] = e.target.value
                    set("alternativas", copy)
                  }}
                  className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted font-mono"
                  placeholder={`Alternativa ${letter} — suporta $LaTeX$`}
                />
                {isCorrect && <span className="text-[11px] text-accent font-semibold flex-shrink-0">✓ CORRETA</span>}
              </div>
            )
          })}
        </div>
      </div>

      <hr className="border-card-border" />

      {/* Gabarito comentado */}
      <div>
        <div className="text-[11px] text-muted font-mono mb-3">/ GABARITO COMENTADO</div>
        <textarea
          value={value.explicacao}
          onChange={(e) => set("explicacao", e.target.value)}
          rows={5}
          className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y font-mono"
          placeholder="Explique por que a alternativa está correta... suporta $LaTeX$."
        />
        {!value.explicacao && (
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-lg">
            ⚠ SEM COMENTÁRIO — alunos não verão feedback
          </div>
        )}
      </div>

      {/* Referências */}
      <div>
        <div className="text-[11px] text-muted font-mono mb-3">/ REFERÊNCIAS (OPCIONAL)</div>
        <textarea
          value={value.referencias}
          onChange={(e) => set("referencias", e.target.value)}
          rows={2}
          className="w-full bg-background border border-card-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-y"
          placeholder={"Lei nº 8.666/93, art. 23\nSTJ - REsp 1.234.567/SP"}
        />
      </div>
    </div>
  )
}
