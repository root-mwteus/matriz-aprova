import { describe, expect, it } from "vitest"
import {
  codigoImportacaoCosseno,
  extrairGabaritoCosseno,
  extrairIdOriginalCosseno,
  normalizarDificuldadeCosseno,
  normalizarQuestaoCosseno,
  caminhoFiguraCosseno,
  urlsIneditasCosseno,
} from "../../../scripts/importar-cosseno-lib.mjs"

describe("importador Cosseno", () => {
  it("usa o identificador público como chave idempotente", () => {
    expect(extrairIdOriginalCosseno("https://cosseno.com/q/10ppntc110")).toBe("10ppntc110")
    expect(codigoImportacaoCosseno("10ppntc110")).toBe("cosseno:10ppntc110")
  })

  it("emite apenas URLs ainda não descobertas para o próximo lote", () => {
    const vistas = new Set(["https://cosseno.com/q/ja-vista"])
    expect(urlsIneditasCosseno([
      "https://cosseno.com/q/ja-vista",
      "https://cosseno.com/q/nova-1",
      "https://cosseno.com/q/nova-1",
      "https://cosseno.com/q/nova-2",
    ], vistas)).toEqual([
      "https://cosseno.com/q/nova-1",
      "https://cosseno.com/q/nova-2",
    ])
  })

  it("cria um caminho estável para figuras e fórmulas renderizadas", () => {
    expect(caminhoFiguraCosseno("abc123", "imagem", 2, "image/jpeg")).toBe("cosseno/abc123/imagem-2.jpg")
    expect(caminhoFiguraCosseno("abc123", "formula", 1, "image/png")).toBe("cosseno/abc123/formula-1.png")
  })

  it("converte a dificuldade pública para o formato do banco", () => {
    expect(normalizarDificuldadeCosseno("Fácil")).toBe("facil")
    expect(normalizarDificuldadeCosseno("Média")).toBe("medio")
    expect(normalizarDificuldadeCosseno("Difícil")).toBe("dificil")
  })

  it("extrai o gabarito dos formatos públicos de resolução", () => {
    expect(extrairGabaritoCosseno("Assim, a alternativa correta é a: LETRA C)")).toBe("C")
    expect(extrairGabaritoCosseno("Produto das raízes: -4/9. Alternativa (C)")).toBe("C")
  })

  it("recusa questão sem cinco alternativas ou gabarito", () => {
    const result = normalizarQuestaoCosseno({
      idOriginal: "abc123",
      url: "https://cosseno.com/q/abc123",
      materia: "Matemática",
      prova: "EFOMM",
      ano: 1997,
      dificuldade: "Fácil",
      assuntos: ["Álgebra"],
      enunciado: "Qual é a alternativa correta nesta questão de exemplo?",
      alternativas: ["A", "B", "C", "D"],
      respostaCorreta: "C",
      imagens: [],
    })

    expect(result.ok).toBe(false)
    expect(result.erro).toMatch(/cinco alternativas/i)
  })

  it("normaliza uma questão completa para a linha persistida", () => {
    const result = normalizarQuestaoCosseno({
      idOriginal: "abc123",
      url: "https://cosseno.com/q/abc123",
      materia: "Matemática",
      prova: "EFOMM",
      ano: 1997,
      dificuldade: "Fácil",
      assuntos: ["Álgebra", "Funções"],
      enunciado: "Qual é a alternativa correta nesta questão de exemplo?",
      alternativas: ["primeira", "segunda", "terceira", "quarta", "quinta"],
      respostaCorreta: "C",
      imagens: ["https://cosseno.com/imagem.png"],
    })

    expect(result).toEqual({
      ok: true,
      questao: expect.objectContaining({
        materia: "Matemática",
        prova: "EFOMM",
        fonte_id_original: "abc123",
        codigo_importacao: "cosseno:abc123",
        resposta_correta: 2,
        sub_materia: "Álgebra; Funções",
      }),
    })
  })
})
