import { RespostaIASchema, type QuestaoExtraida } from "./schema"
import { chunkTexto, dedupePorEnunciado } from "./chunk"

// Prompt literal do extrator.md — a IA devolve APENAS JSON com `questoes[]`.
// Mantido como constantes para facilitar `diff` contra o markdown.

const PROMPT_SISTEMA = `Você é o extrator de questões da Matriz Aprova.

TAREFA: receber um BLOCO DE TEXTO bruto (de PDF ou HTML já limpo, sem navegação) e devolver APENAS JSON conforme o schema. Nenhum comentário, nenhuma explicação fora do JSON.

REGRAS INEGOCIÁVEIS:
- Copie enunciado e alternativas literalmente; não resuma, não corrija, não invente.
- Converta matemática para KaTeX: \\( ... \\) para inline, \\[ ... \\] para display.
- 5 alternativas sempre (A-E). Se faltar, use texto "" e confianca <=0.4.
- resposta_correta só se o gabarito estiver explícito no bloco; caso contrário, null.
- materia é obrigatória; infira se necessário a partir do conteúdo.
- Se o bloco não contiver nenhuma questão objetiva A-E, devolva {"questoes":[]}.
- Nunca alucine banca/ano; use null se não estiver no texto.
- Responda em pt-BR, mas mantenha termos técnicos originais.

FORMATO DE SAÍDA (exato):
{"questoes":[{... conforme schema}]}`

function promptUsuario(
  textoChunk: string,
  i: number,
  total: number,
  fonte: string,
  fonteUrl: string | null,
  bancaHint: string | null,
): string {
  return `BLOCO ${i}/${total} — ${fonte} (banca=${bancaHint ?? "null"}, url=${fonteUrl ?? "null"})

TEXTO BRUTO (pode conter quebras, cabeçalhos, gabarito ao final):
---
${textoChunk}
---

INSTRUÇÕES:
1. Extraia todas as questões A-E deste bloco.
2. Para cada, preencha materia/banca/ano/nivel quando dedutível do cabeçalho; caso contrário null.
3. Converta fórmulas para \\( \\) ou \\[ \\].
4. Se o gabarito estiver no bloco (ex.: "Gabarito: ..."), preencha resposta_correta e confianca 0.95; senão null e confianca 0.5.
5. Devolva APENAS o JSON. Não repita o texto bruto.`
}

function repararJson(texto: string): string {
  return texto
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .trim()
}

export interface ParseOptions {
  fonte: string
  fonteUrl: string | null
  bancaHint?: string | null
  openaiApiKey?: string
}

export async function parseChunksComIA(
  textoCompleto: string,
  opts: ParseOptions,
): Promise<{ questoes: QuestaoExtraida[]; chunks: number; custoEstimadoTokens: number }> {
  const apiKey = opts.openaiApiKey ?? process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY não configurada")

  const chunks = chunkTexto(textoCompleto)
  const todas: QuestaoExtraida[] = []
  let tokensEstimados = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!
    tokensEstimados += Math.ceil((PROMPT_SISTEMA.length + chunk.length) / 4)

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: PROMPT_SISTEMA },
          {
            role: "user",
            content: promptUsuario(chunk, i + 1, chunks.length, opts.fonte, opts.fonteUrl, opts.bancaHint ?? null),
          },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`OpenAI ${res.status}: ${body.slice(0, 500)}`)
    }

    const body = (await res.json()) as {
      choices: { message: { content: string } }[]
      usage?: { total_tokens?: number }
    }
    if (body.usage?.total_tokens) tokensEstimados = body.usage.total_tokens

    const raw = body.choices?.[0]?.message?.content ?? '{"questoes":[]}'
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = JSON.parse(repararJson(raw))
    }

    // Fallback: tenta reparar JSON mal formado antes de validar
    let valid = RespostaIASchema.safeParse(parsed)
    if (!valid.success) {
      const repaired = JSON.parse(repararJson(typeof raw === "string" ? raw : JSON.stringify(parsed)))
      valid = RespostaIASchema.safeParse(repaired)
    }
    if (!valid.success) {
      // Chunk com erro não derruba o job — loga e segue
      console.error("parse-ia: chunk", i + 1, "zod erro", valid.error.issues.slice(0, 3))
      continue
    }

    // Reordena por ordem local e injeta ordem global sequencial
    const base = todas.length
    for (const q of valid.data.questoes) {
      todas.push({ ...q, ordem: base + q.ordem })
    }
  }

  // Dedupe por enunciado (overlap entre chunks) — preserva primeira ocorrência
  const unicas = dedupePorEnunciado(
    todas.map((q, idx) => ({ ...q, ordem: idx + 1 })),
  )

  return { questoes: unicas, chunks: chunks.length, custoEstimadoTokens: tokensEstimados }
}
