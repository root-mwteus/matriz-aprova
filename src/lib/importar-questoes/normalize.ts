import { createHash } from "node:crypto"
import type { QuestaoExtraida } from "./schema"

// Normalização reusa a lógica de importar-simulados.mjs (materiais/simulados):
// alternativas {letra,texto} → {letter,text}, nível com acento → sem acento,
// origem/fonte_url coerentes, codigo_importacao idempotente por fonte.
// O hash da fonte evita que reimportar o mesmo PDF/URL duplique questões.

const LETRAS = ["A", "B", "C", "D", "E"] as const

const NIVEL = new Map([
  ["fácil", "facil"],
  ["facil", "facil"],
  ["básico", "facil"],
  ["basico", "facil"],
  ["médio", "medio"],
  ["medio", "medio"],
  ["difícil", "dificil"],
  ["dificil", "dificil"],
  ["avançado", "dificil"],
  ["avancado", "dificil"],
])

export function normalizarAlternativas(
  alternativas: QuestaoExtraida["alternativas"],
): { letter: string; text: string }[] {
  return alternativas.map((alt, index) => ({
    letter: alt.letra ?? LETRAS[index] ?? "A",
    text: alt.texto.trim(),
  }))
}

export function normalizarNivel(nivel: QuestaoExtraida["nivel"]): string | null {
  if (!nivel) return null
  return NIVEL.get(nivel) ?? null
}

export function hashFonte(fonte: string): string {
  return createHash("sha1").update(fonte).digest("hex").slice(0, 8)
}

export function codigoImportacao(fonte: string, ordem: number): string {
  return `import:${hashFonte(fonte)}:${ordem}`
}

export interface QuestionRow {
  materia: string
  sub_materia: string | null
  banca: string | null
  ano: number | null
  nivel: string | null
  area_concurso: string | null
  enunciado: string
  texto_referencia: string | null
  mostrar_texto: boolean
  alternativas: { letter: string; text: string }[]
  resposta_correta: number
  explicacao: string | null
  referencias: string | null
  figuras: { id: string; storage_path: string; legenda: string | null }[]
  origem: string
  fonte_url: string | null
  codigo_importacao: string
}

export function paraQuestionRow(
  questao: QuestaoExtraida,
  fonte: string,
  areaConcurso: string | null,
): QuestionRow | null {
  const nivel = normalizarNivel(questao.nivel)
  // Questão sem gabarito ou sem nível não entra no banco até revisão manual.
  if (questao.resposta_correta === null || questao.resposta_correta < 0 || questao.resposta_correta > 4) {
    return null
  }
  if (!questao.materia) return null

  const alternativas = normalizarAlternativas(questao.alternativas)
  if (alternativas.length !== 5 || alternativas.some((a) => !a.text.trim())) return null

  const origem = questao.origem ?? "adaptada"
  if (origem === "adaptada" && !questao.fonte_url) return null
  if (origem === "inédita" && questao.fonte_url) return null

  return {
    materia: questao.materia,
    sub_materia: questao.sub_materia,
    banca: questao.banca,
    ano: questao.ano,
    nivel,
    area_concurso: areaConcurso,
    enunciado: questao.enunciado,
    texto_referencia: questao.texto_referencia,
    mostrar_texto: !!questao.texto_referencia,
    alternativas,
    resposta_correta: questao.resposta_correta,
    explicacao: questao.explicacao,
    referencias: questao.referencias.length ? questao.referencias.join("; ") : null,
    figuras: questao.figuras.map((f, i) => ({
      id: `fig-${i}`,
      storage_path: "", // preenchido pelo extrator de imagens quando houver
      legenda: f.legenda,
    })),
    origem,
    fonte_url: questao.fonte_url,
    codigo_importacao: codigoImportacao(fonte, questao.ordem),
  }
}
