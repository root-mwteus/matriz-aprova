const LETRAS = ["A", "B", "C", "D", "E"]

export function extrairIdOriginalCosseno(url) {
  const match = String(url).match(/\/q\/([^/?#]+)/)
  return match?.[1] ?? null
}

export function codigoImportacaoCosseno(idOriginal) {
  return `cosseno:${idOriginal}`
}

export function urlsIneditasCosseno(urls, vistas) {
  const novas = []
  for (const url of urls) {
    if (!vistas.has(url)) {
      vistas.add(url)
      novas.push(url)
    }
  }
  return novas
}

export function caminhoFiguraCosseno(idOriginal, tipo, indice, contentType) {
  const extensao = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png"
  return `cosseno/${idOriginal}/${tipo}-${indice}.${extensao}`
}

export function extrairGabaritoCosseno(texto) {
  const valor = String(texto ?? "")
  return valor.match(/alternativa\s+correta\s+é\s+a:\s*(?:letra\s*)?\(?([A-E])\)?/i)?.[1]
    ?? valor.match(/alternativa\s*\(?([A-E])\)?/i)?.[1]
    ?? null
}

export function normalizarDificuldadeCosseno(valor) {
  const normalizado = String(valor ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (normalizado === "facil") return "facil"
  if (normalizado === "media" || normalizado === "medio") return "medio"
  if (normalizado === "dificil") return "dificil"
  return null
}

function limparTexto(valor) {
  return String(valor ?? "").replace(/\s+/g, " ").trim()
}

export function normalizarQuestaoCosseno(bruta) {
  const idOriginal = limparTexto(bruta.idOriginal)
  const enunciado = limparTexto(bruta.enunciado)
  const alternativas = (bruta.alternativas ?? []).map(limparTexto).filter(Boolean)
  const resposta = LETRAS.indexOf(limparTexto(bruta.respostaCorreta).toUpperCase())

  if (!idOriginal) return { ok: false, erro: "ID original ausente" }
  if (!/^https:\/\/cosseno\.com\/q\//.test(bruta.url ?? "")) return { ok: false, erro: "URL original inválida" }
  if (!enunciado || enunciado.length < 10) return { ok: false, erro: "Enunciado ausente ou curto" }
  if (alternativas.length !== 5) return { ok: false, erro: "A questão deve ter cinco alternativas" }
  if (resposta < 0) return { ok: false, erro: "Gabarito público não identificado" }

  return {
    ok: true,
    questao: {
      materia: limparTexto(bruta.materia) || "Não classificada",
      sub_materia: (bruta.assuntos ?? []).map(limparTexto).filter(Boolean).join("; ") || null,
      banca: null,
      ano: Number.isInteger(bruta.ano) ? bruta.ano : null,
      nivel: normalizarDificuldadeCosseno(bruta.dificuldade),
      area_concurso: null,
      enunciado,
      texto_referencia: null,
      mostrar_texto: false,
      alternativas: alternativas.map((text, index) => ({ letter: LETRAS[index], text })),
      resposta_correta: resposta,
      explicacao: null,
      referencias: `Assuntos: ${(bruta.assuntos ?? []).map(limparTexto).filter(Boolean).join(", ") || "não informado"}`,
      figuras: [],
      origem: "pública",
      fonte_url: bruta.url,
      fonte_id_original: idOriginal,
      prova: limparTexto(bruta.prova) || null,
      imagens_origem: [...new Set((bruta.imagens ?? []).filter((url) => /^https?:\/\//.test(url)))],
      codigo_importacao: codigoImportacaoCosseno(idOriginal),
    },
  }
}
