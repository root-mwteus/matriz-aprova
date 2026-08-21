import { describe, it, expect } from "vitest"
import { QuestaoExtraidaSchema, parseQuestaoExtraida, type QuestaoExtraida } from "../importar-questoes/schema"
import {
  normalizarAlternativas,
  normalizarNivel,
  codigoImportacao,
  paraQuestionRow,
} from "../importar-questoes/normalize"

const questaoBase: QuestaoExtraida = {
  ordem: 1,
  materia: "Direito Constitucional",
  sub_materia: null,
  banca: "CESPE/CEBRASPE",
  ano: 2023,
  nivel: "medio",
  enunciado: "Com base no art. 5º da CF, assinale a alternativa correta.",
  texto_referencia: null,
  alternativas: [
    { letra: "A", texto: "a" },
    { letra: "B", texto: "b" },
    { letra: "C", texto: "c" },
    { letra: "D", texto: "d" },
    { letra: "E", texto: "e" },
  ],
  resposta_correta: 2,
  explicacao: null,
  referencias: [],
  origem: "pública",
  fonte_url: "https://exemplo.com/prova.pdf",
  confianca: 0.95,
  figuras: [],
}

describe("QuestaoExtraidaSchema", () => {
  it("aceita questão válida", () => {
    const r = parseQuestaoExtraida(questaoBase)
    expect(r.success).toBe(true)
  })
  it("rejeita 4 alternativas", () => {
    const r = parseQuestaoExtraida({
      ...questaoBase,
      alternativas: questaoBase.alternativas.slice(0, 4),
    })
    expect(r.success).toBe(false)
  })
  it("aceita materia livre (validação de MATERIAS é no preview/normalize)", () => {
    const r = parseQuestaoExtraida({ ...questaoBase, materia: "Astrologia" })
    expect(r.success).toBe(true)
  })
  it("aceita resposta_correta null (revisão humana)", () => {
    const r = parseQuestaoExtraida({ ...questaoBase, resposta_correta: null })
    expect(r.success).toBe(true)
  })
})

describe("normalizarAlternativas", () => {
  it("converte {letra,texto} para {letter,text}", () => {
    const out = normalizarAlternativas(questaoBase.alternativas)
    expect(out[0]).toEqual({ letter: "A", text: "a" })
    expect(out).toHaveLength(5)
  })
})

describe("normalizarNivel", () => {
  it("remove acentos", () => {
    expect((normalizarNivel as (v: string | null) => string | null)("médio")).toBe("medio")
    expect((normalizarNivel as (v: string | null) => string | null)("difícil")).toBe("dificil")
  })
  it("mantém null quando ausente", () => {
    expect(normalizarNivel(null)).toBeNull()
  })
})

describe("codigoImportacao", () => {
  it("é determinístico por fonte+ordem", () => {
    const a = codigoImportacao("prova.pdf", 1)
    const b = codigoImportacao("prova.pdf", 1)
    expect(a).toBe(b)
    expect(a).toMatch(/^import:[a-f0-9]{8}:1$/)
  })
  it("muda com ordem diferente", () => {
    expect(codigoImportacao("prova.pdf", 1)).not.toBe(codigoImportacao("prova.pdf", 2))
  })
})

describe("paraQuestionRow", () => {
  it("converte para formato de importar-simulados.mjs", () => {
    const row = paraQuestionRow(questaoBase, "prova.pdf", "concursos")
    expect(row).not.toBeNull()
    expect(row?.alternativas).toHaveLength(5)
    expect(row?.resposta_correta).toBe(2)
    expect(row?.origem).toBe("pública")
    expect(row?.codigo_importacao).toMatch(/^import:/)
  })
  it("retorna null quando sem gabarito", () => {
    const row = paraQuestionRow({ ...questaoBase, resposta_correta: null }, "prova.pdf", null)
    expect(row).toBeNull()
  })
  it("retorna null quando alternativa vazia", () => {
    const alternativas = questaoBase.alternativas.map((a, i) => (i === 2 ? { ...a, texto: "" } : a))
    const row = paraQuestionRow({ ...questaoBase, alternativas }, "prova.pdf", null)
    expect(row).toBeNull()
  })
})
