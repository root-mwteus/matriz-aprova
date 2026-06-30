"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { QuestaoForm, emptyDraft, validarDraft, draftToRow, type QuestaoDraft } from "@/components/admin/QuestaoForm"

interface QuestaoExtraida {
  enunciado: string
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
}

interface CardState {
  draft: QuestaoDraft
  figurasDescricao: string[]
  incluir: boolean
  aberto: boolean
}

function extraidaParaDraft(q: QuestaoExtraida): QuestaoDraft {
  const alts = ["", "", "", "", ""]
  q.alternativas.slice(0, 5).forEach((a, i) => { alts[i] = a })
  return {
    ...emptyDraft(),
    materia: q.materia || "",
    subMateria: q.sub_materia || "",
    banca: q.banca || "",
    ano: q.ano ? String(q.ano) : "",
    area: q.area_concurso || "",
    enunciado: q.enunciado || "",
    explicacao: q.explicacao || "",
    referencias: q.referencias || "",
    alternativas: alts,
    correta: q.resposta_correta ?? 0,
    figuras: [],
  }
}

export default function RevisarImportacaoPage() {
  const router = useRouter()
  const [cards, setCards] = useState<CardState[]>([])
  const [carregado, setCarregado] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem("questoes_extraidas")
    if (!raw) {
      setCarregado(true)
      return
    }
    try {
      const questoes: QuestaoExtraida[] = JSON.parse(raw)
      setCards(
        questoes.map((q) => ({
          draft: extraidaParaDraft(q),
          figurasDescricao: q.figuras_descricao || [],
          incluir: true,
          aberto: false,
        }))
      )
    } catch {
      toast.error("Não foi possível ler as questões extraídas")
    }
    setCarregado(true)
  }, [])

  function atualizarCard(i: number, patch: Partial<CardState>) {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }

  async function salvarTodas() {
    const incluidos = cards.filter((c) => c.incluir)
    if (incluidos.length === 0) {
      toast.error("Selecione ao menos uma questão para salvar")
      return
    }

    // Valida cada questão incluída antes de inserir.
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

    sessionStorage.removeItem("questoes_extraidas")
    toast.success(`${rows.length} questões salvas no banco`)
    router.push("/admin/questoes")
    router.refresh()
  }

  if (!carregado) return <div className="text-muted text-sm">Carregando...</div>

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Revisar Importação</h1>
          <Link href="/admin/questoes" className="text-xs text-muted hover:text-foreground font-mono">← VOLTAR</Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-[#2A2A2A] rounded-card">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-sm text-muted">Nenhuma questão para revisar.</p>
          <Link
            href="/admin/questoes/importar-pdf"
            className="mt-4 text-xs bg-accent/20 text-accent border border-accent/40 px-4 py-2 rounded-lg font-semibold hover:bg-accent/30 transition-colors"
          >
            IMPORTAR UM PDF →
          </Link>
        </div>
      </div>
    )
  }

  const totalIncluidas = cards.filter((c) => c.incluir).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-title uppercase text-foreground">/ Revisar Importação</h1>
          <span className="text-xs text-muted font-mono">{totalIncluidas}/{cards.length} selecionadas</span>
        </div>
        <Link href="/admin/questoes/importar-pdf" className="text-xs text-muted hover:text-foreground font-mono">← REENVIAR</Link>
      </div>

      <p className="text-sm text-muted">
        Revise cada questão extraída. Desmarque as que não quer importar, edite o que precisar e
        anexe imagens onde a IA detectou figuras. Nada foi salvo ainda.
      </p>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`border rounded-card overflow-hidden transition-colors ${
              card.incluir ? "border-[#2A2A2A] bg-card" : "border-[#1A1A1A] bg-card/40 opacity-60"
            }`}
          >
            {/* Cabeçalho do card */}
            <div className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={card.incluir}
                onChange={(e) => atualizarCard(i, { incluir: e.target.checked })}
                className="w-4 h-4 accent-accent flex-shrink-0"
              />
              <button
                onClick={() => atualizarCard(i, { aberto: !card.aberto })}
                className="flex-1 flex items-center gap-3 min-w-0 text-left"
              >
                <span className="text-xs text-muted font-mono flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full flex-shrink-0">
                  {card.draft.materia || "sem matéria"}
                </span>
                <span className="text-sm text-foreground truncate flex-1">
                  {card.draft.enunciado.slice(0, 70) || "(sem enunciado)"}
                </span>
                {card.figurasDescricao.length > 0 && (
                  <span className="text-[11px] text-yellow-400 flex-shrink-0" title="Contém figura">🖼</span>
                )}
                {validarDraft(card.draft) && card.incluir && (
                  <span className="text-[11px] text-red-400 flex-shrink-0" title={validarDraft(card.draft)!}>⚠</span>
                )}
                <span className="text-muted text-xs flex-shrink-0">{card.aberto ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* Corpo editável */}
            {card.aberto && (
              <div className="border-t border-[#2A2A2A] p-5">
                <QuestaoForm
                  value={card.draft}
                  onChange={(d) => atualizarCard(i, { draft: d })}
                  figurasDescricao={card.figurasDescricao}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Barra fixa de ação */}
      <div className="sticky bottom-4 flex items-center justify-between bg-card border border-[#2A2A2A] rounded-card p-4 shadow-lg">
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
    </motion.div>
  )
}
