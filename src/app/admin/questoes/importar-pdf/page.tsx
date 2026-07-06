"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { UploadZone } from "@/components/admin/UploadZone"
import { CropModal } from "@/components/admin/CropModal"
import { createClient } from "@/lib/supabase/client"
import { renderPdfToPages, countPdfPages, cropImage, type PageImage } from "@/lib/pdf"

type Modelo = "gpt-4o-mini" | "gpt-4o"

const CUSTO_USD: Record<Modelo, number> = {
  "gpt-4o-mini": 0.0015,
  "gpt-4o": 0.016,
}
const USD_BRL = 5.9

function estimarCusto(paginas: number, modelo: Modelo) {
  const usd = paginas * CUSTO_USD[modelo]
  const brl = usd * USD_BRL
  return { usd: usd.toFixed(3), brl: brl < 0.10 ? brl.toFixed(3) : brl.toFixed(2) }
}
import {
  QuestaoForm,
  emptyDraft,
  validarDraft,
  draftToRow,
  uploadFiguraBlob,
  type QuestaoDraft,
} from "@/components/admin/QuestaoForm"

type Fase = "idle" | "estimativa" | "processando" | "revisao"

interface FiguraBbox {
  x: number
  y: number
  w: number
  h: number
}

interface QuestaoExtraida {
  enunciado: string
  texto_referencia: string | null
  alternativas: string[]
  resposta_correta: number | null
  explicacao: string | null
  referencias: string | null
  materia: string
  sub_materia: string | null
  banca: string | null
  ano: number | null
  area_concurso: string | null
  figuras_descricao: string[]
  figuras_bbox: FiguraBbox[]
  completa: boolean
  aviso: string | null
}

interface CardState {
  draft: QuestaoDraft
  figurasDescricao: string[]
  pageNumber: number
  completa: boolean
  aviso: string | null
  incluir: boolean
  aberto: boolean
}

function extraidaParaCard(q: QuestaoExtraida, pageNumber: number): CardState {
  const alts = ["", "", "", "", ""]
  q.alternativas.slice(0, 5).forEach((a, i) => { alts[i] = a })
  return {
    draft: {
      ...emptyDraft(),
      materia: q.materia || "",
      subMateria: q.sub_materia || "",
      banca: q.banca || "",
      ano: q.ano ? String(q.ano) : "",
      area: q.area_concurso || "",
      enunciado: q.enunciado || "",
      textoReferencia: q.texto_referencia || "",
      mostrarTexto: true,
      explicacao: q.explicacao || "",
      referencias: q.referencias || "",
      alternativas: alts,
      correta: q.resposta_correta ?? 0,
      figuras: [],
    },
    figurasDescricao: q.figuras_descricao || [],
    pageNumber,
    completa: q.completa ?? true,
    aviso: q.aviso,
    incluir: true,
    aberto: false,
  }
}

export default function ImportarPdfPage() {
  const router = useRouter()
  const [fase, setFase] = useState<Fase>("idle")
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageImage[]>([])
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 })
  const [statusTxt, setStatusTxt] = useState("")
  const [cards, setCards] = useState<CardState[]>([])
  const [salvando, setSalvando] = useState(false)
  const [cropTarget, setCropTarget] = useState<{ cardIndex: number; pageNumber: number; figuraId?: string } | null>(null)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [modelo, setModelo] = useState<Modelo>("gpt-4o-mini")
  const [paginaInicio, setPaginaInicio] = useState(1)
  const [paginaFim, setPaginaFim] = useState(0)

  function atualizarCard(i: number, patch: Partial<CardState>) {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  async function handleFileSelected(f: File) {
    if (f.type !== "application/pdf") { toast.error("O arquivo precisa ser um PDF"); return }
    setFile(f)
    setFase("estimativa")
    try {
      const total = await countPdfPages(f)
      setTotalPaginas(total)
      setPaginaInicio(1)
      setPaginaFim(total)
    } catch {
      toast.error("Não foi possível ler este PDF")
      setFase("idle")
    }
  }

  async function handleExtrair() {
    if (!file) return

    const inicio = Math.max(1, paginaInicio)
    const fim = Math.min(paginaFim || totalPaginas, totalPaginas)
    if (inicio > fim) { toast.error("Intervalo de páginas inválido"); return }

    setFase("processando")
    setCards([])
    setProgresso({ atual: 0, total: 0 })

    // 1. Renderiza apenas o intervalo selecionado.
    let renderizadas: PageImage[]
    try {
      setStatusTxt("Renderizando páginas do PDF...")
      renderizadas = await renderPdfToPages(file, 2, (_, total) => {
        setProgresso((p) => ({ atual: p.atual, total }))
      }, inicio, fim)
      setPages(renderizadas)
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível ler este PDF")
      setFase("idle")
      return
    }

    if (renderizadas.length === 0) {
      toast.error("PDF vazio")
      setFase("idle")
      return
    }

    // 2. Extrai questões página a página (progresso + resultados ao vivo).
    setProgresso({ atual: 0, total: renderizadas.length })
    let totalQuestoes = 0
    for (let i = 0; i < renderizadas.length; i++) {
      const page = renderizadas[i]
      const proxima = renderizadas[i + 1]
      setStatusTxt(`Lendo página ${page.pageNumber} de ${fim} com IA...`)
      try {
        const res = await fetch("/api/admin/extrair-questoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_image: page.dataUrl,
            next_page_image: proxima?.dataUrl,
            page_number: page.pageNumber,
            model: modelo,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          toast.error(`Página ${page.pageNumber}: ${json.error || "erro"}`)
        } else {
          const questoes = json.questoes as QuestaoExtraida[]
          const novos: CardState[] = []
          for (const q of questoes) {
            const card = extraidaParaCard(q, page.pageNumber)
            if (q.figuras_bbox && q.figuras_bbox.length > 0) {
              setStatusTxt(`Recortando figura da página ${page.pageNumber}...`)
              const figurasList: Awaited<ReturnType<typeof uploadFiguraBlob>>[] = []
              for (const bbox of q.figuras_bbox) {
                try {
                  const rect = {
                    x: Math.max(0, bbox.x * page.width),
                    y: Math.max(0, bbox.y * page.height),
                    w: Math.max(1, bbox.w * page.width),
                    h: Math.max(1, bbox.h * page.height),
                  }
                  const blob = await cropImage(page.dataUrl, rect)
                  figurasList.push(await uploadFiguraBlob(blob))
                } catch (err) {
                  console.error("Erro ao recortar figura:", err)
                }
              }
              card.draft.figuras = figurasList
            }
            novos.push(card)
          }
          if (novos.length > 0) {
            totalQuestoes += novos.length
            setCards((prev) => [...prev, ...novos])
          }
        }
      } catch (err) {
        console.error(err)
        toast.error(`Falha de rede na página ${page.pageNumber}`)
      }
      setProgresso({ atual: i + 1, total: renderizadas.length })
    }

    setFase("revisao")
    if (totalQuestoes === 0) {
      toast.error("Nenhuma questão identificada no PDF")
    } else {
      toast.success(`${totalQuestoes} questões extraídas — revise e salve`)
    }
  }

  async function handleCropped(blob: Blob) {
    if (!cropTarget) return
    const { cardIndex, figuraId } = cropTarget
    try {
      const novaFigura = await uploadFiguraBlob(blob)

      if (figuraId) {
        // Ajuste: substitui a figura existente e descarta a antiga do storage.
        const antiga = cards[cardIndex]?.draft.figuras.find((f) => f.id === figuraId)
        if (antiga) {
          const supabase = createClient()
          await supabase.storage.from("questoes-figuras").remove([antiga.storage_path])
        }
        setCards((prev) =>
          prev.map((c, idx) =>
            idx === cardIndex
              ? {
                  ...c,
                  draft: {
                    ...c.draft,
                    figuras: c.draft.figuras.map((f) =>
                      f.id === figuraId ? { ...novaFigura, legenda: f.legenda } : f
                    ),
                  },
                }
              : c
          )
        )
        toast.success("Figura ajustada")
      } else {
        setCards((prev) =>
          prev.map((c, idx) =>
            idx === cardIndex ? { ...c, draft: { ...c.draft, figuras: [...c.draft.figuras, novaFigura] } } : c
          )
        )
        toast.success("Figura recortada e anexada")
      }
    } catch (err) {
      console.error(err)
      toast.error("Erro ao salvar o recorte")
    }
    setCropTarget(null)
  }

  async function salvarTodas() {
    const incluidos = cards.filter((c) => c.incluir)
    if (incluidos.length === 0) { toast.error("Selecione ao menos uma questão"); return }

    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].incluir) continue
      const erro = validarDraft(cards[i].draft)
      if (erro) {
        atualizarCard(i, { aberto: true })
        toast.error(`Questão ${i + 1}: ${erro}`)
        return
      }
    }

    setSalvando(true)
    const supabase = createClient()
    const rows = incluidos.map((c) => draftToRow(c.draft))
    const { error } = await supabase.from("questions").insert(rows)
    setSalvando(false)

    if (error) {
      console.error("Erro ao salvar questões:", error)
      toast.error("Erro ao salvar: " + error.message)
      return
    }

    toast.success(`${rows.length} questões salvas no banco`)
    router.push("/admin/questoes")
    router.refresh()
  }

  const totalIncluidas = cards.filter((c) => c.incluir).length
  const pctProgresso = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Importar Prova (PDF)</h1>
        <Link href="/admin/questoes" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
      </div>

      {/* UPLOAD */}
      {fase === "idle" && (
        <div className="bg-card border border-card-border rounded-card p-6 space-y-5">
          <p className="text-sm text-muted">
            Envie o PDF de uma prova. A IA lê página por página e as questões aparecem aqui na hora,
            com fórmulas em LaTeX. Você revisa, recorta as figuras direto do PDF e salva.
          </p>
          <UploadZone onFile={handleFileSelected} accept=".pdf" />
          <div className="text-[11px] text-muted bg-background border border-card-border rounded-lg p-3 space-y-1">
            <p>• O PDF é processado no seu navegador — só as imagens das páginas vão para a IA.</p>
            <p>• Figuras/gráficos: use <span className="text-foreground">✂ Recortar do PDF</span> na revisão para capturar a área exata.</p>
            <p>• Nada é salvo no banco até você confirmar.</p>
          </div>
        </div>
      )}

      {/* ESTIMATIVA DE CUSTO */}
      {fase === "estimativa" && totalPaginas > 0 && (() => {
        const pags = Math.max(0, Math.min(paginaFim, totalPaginas) - Math.max(1, paginaInicio) + 1)
        const custo = estimarCusto(pags, modelo)
        return (
          <div className="bg-card border border-card-border rounded-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{file?.name}</p>
                <p className="text-xs text-muted font-mono mt-0.5">{totalPaginas} páginas no total</p>
              </div>
              <button onClick={() => { setFase("idle"); setFile(null) }} className="text-xs text-muted hover:text-foreground font-mono">✕ trocar</button>
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">Modelo</p>
              <div className="grid grid-cols-2 gap-3">
                {(["gpt-4o-mini", "gpt-4o"] as Modelo[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModelo(m)}
                    className={`rounded-lg border p-3 text-left transition-colors ${modelo === m ? "border-accent bg-accent/10" : "border-card-border hover:border-accent/50"}`}
                  >
                    <p className={`text-sm font-bold font-mono ${modelo === m ? "text-accent" : "text-foreground"}`}>{m}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      {m === "gpt-4o-mini" ? "Econômico · recomendado para texto puro" : "Completo · melhor para figuras e mapas"}
                    </p>
                    <p className="text-[10px] font-mono mt-1.5 text-muted">~${CUSTO_USD[m].toFixed(4)}/página</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Intervalo de páginas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest">Intervalo de páginas</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-muted">De</label>
                  <input
                    type="number" min={1} max={totalPaginas} value={paginaInicio}
                    onChange={(e) => setPaginaInicio(Number(e.target.value))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-muted">Até</label>
                  <input
                    type="number" min={1} max={totalPaginas} value={paginaFim}
                    onChange={(e) => setPaginaFim(Number(e.target.value))}
                    className="w-full bg-background border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] text-muted">Páginas</label>
                  <div className="px-3 py-2 text-sm font-mono text-accent">{pags}</div>
                </div>
              </div>
            </div>

            {/* Estimativa */}
            <div className="bg-background border border-card-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-mono">Custo estimado</p>
                <p className="text-2xl font-bold font-mono text-foreground mt-0.5">~R${custo.brl}</p>
                <p className="text-[11px] text-muted mt-0.5">~${custo.usd} USD · {pags} páginas · {modelo}</p>
              </div>
              <div className="text-3xl">🧮</div>
            </div>

            <button
              onClick={handleExtrair}
              disabled={pags <= 0}
              className="w-full text-sm bg-accent text-accent-foreground font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CONFIRMAR E EXTRAIR {pags} PÁGINAS →
            </button>
          </div>
        )
      })()}

      {/* PROGRESSO */}
      {fase === "processando" && (
        <div className="bg-card border border-card-border rounded-card p-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-accent">{statusTxt}</span>
            <span className="text-muted font-mono">{progresso.atual}/{progresso.total}</span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              animate={{ width: `${pctProgresso}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted">
            {cards.length} {cards.length === 1 ? "questão encontrada" : "questões encontradas"} até agora...
          </p>
        </div>
      )}

      {/* BANNER DE REVISÃO */}
      {fase === "revisao" && (
        <div className="flex items-center justify-between bg-card border border-card-border rounded-card p-4">
          <span className="text-sm text-muted">
            <span className="text-accent font-mono">{totalIncluidas}/{cards.length}</span> selecionadas para salvar
          </span>
          <button onClick={() => { setFase("idle"); setCards([]); setFile(null); setTotalPaginas(0) }} className="text-xs text-muted hover:text-foreground font-mono">
            ↻ OUTRO PDF
          </button>
        </div>
      )}

      {/* LISTA DE QUESTÕES (ao vivo + revisão) */}
      {cards.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {cards.map((card, i) => {
              const erro = card.incluir ? validarDraft(card.draft) : null
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-card overflow-hidden transition-colors ${
                    card.incluir ? "border-card-border bg-card" : "border-card bg-card/40 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={card.incluir}
                      onChange={(e) => atualizarCard(i, { incluir: e.target.checked })}
                      className="w-4 h-4 accent-accent flex-shrink-0"
                      disabled={fase === "processando"}
                    />
                    <button
                      onClick={() => atualizarCard(i, { aberto: !card.aberto })}
                      className="flex-1 flex items-center gap-3 min-w-0 text-left"
                    >
                      <span className="text-xs text-muted font-mono flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[10px] text-muted font-mono flex-shrink-0">p{card.pageNumber}</span>
                      <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                        {card.draft.materia || "sem matéria"}
                      </span>
                      <span className="text-sm text-foreground truncate flex-1">
                        {card.draft.enunciado.slice(0, 60) || "(sem enunciado)"}
                      </span>
                      {card.draft.textoReferencia && (
                        <span className="text-[11px] text-blue-300 flex-shrink-0" title="Tem texto de referência">📄</span>
                      )}
                      {card.figurasDescricao.length > 0 && card.draft.figuras.length === 0 && (
                        <span className="text-[11px] text-yellow-400 flex-shrink-0" title="Figura detectada — recorte do PDF">🖼</span>
                      )}
                      {card.draft.figuras.length > 0 && (
                        <span className="text-[11px] text-accent flex-shrink-0" title="Figura anexada">✓🖼</span>
                      )}
                      {!card.completa && card.aviso && (
                        <span className="text-[11px] text-orange-400 flex-shrink-0" title={card.aviso}>⚠ incompleta</span>
                      )}
                      {erro && <span className="text-[11px] text-red-400 flex-shrink-0" title={erro}>⚠</span>}
                      <span className="text-muted text-xs flex-shrink-0">{card.aberto ? "▲" : "▼"}</span>
                    </button>
                  </div>

                  {card.aberto && (
                    <div className="border-t border-card-border p-5">
                      {!card.completa && card.aviso && (
                        <div className="mb-4 text-[11px] text-orange-400 bg-orange-400/10 border border-orange-400/20 rounded-lg px-3 py-2">
                          ⚠ A IA sinalizou: {card.aviso}
                        </div>
                      )}
                      <QuestaoForm
                        value={card.draft}
                        onChange={(d) => atualizarCard(i, { draft: d })}
                        figurasDescricao={card.figurasDescricao}
                        onCropFromPdf={(figuraId) => setCropTarget({ cardIndex: i, pageNumber: card.pageNumber, figuraId })}
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* BARRA DE SALVAR */}
      {fase === "revisao" && cards.length > 0 && (
        <div className="sticky bottom-4 flex items-center justify-between bg-card border border-card-border rounded-card p-4 shadow-lg">
          <span className="text-sm text-muted">
            {totalIncluidas} {totalIncluidas === 1 ? "questão será salva" : "questões serão salvas"}
          </span>
          <button
            onClick={salvarTodas}
            disabled={salvando || totalIncluidas === 0}
            className="text-sm bg-accent text-accent-foreground font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {salvando ? "SALVANDO..." : `SALVAR ${totalIncluidas} QUESTÕES →`}
          </button>
        </div>
      )}

      {/* MODAL DE RECORTE */}
      {cropTarget && (
        <CropModal
          pages={pages}
          initialPage={cropTarget.pageNumber}
          onCancel={() => setCropTarget(null)}
          onCropped={handleCropped}
        />
      )}
    </motion.div>
  )
}
