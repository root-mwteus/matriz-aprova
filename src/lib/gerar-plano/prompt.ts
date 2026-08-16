import OpenAI from "openai"
import { z } from "zod"
import type { PlanoConcurso } from "@/lib/gerar-plano/planos-concursos"
import type { SemanaPlano } from "@/lib/gerar-plano/gerar-plano"

/**
 * Refino opcional dos focos semanais via IA.
 *
 * O gerador já distribui as matérias por peso de forma determinística. A IA
 * entra só para dar um "foco" mais inteligente por semana (ex.: "Semana 3 —
 * foco em Direito Tributário: lançamento e obrigação tributária"). É uma
 * chamada compacta: a saída é uma lista de strings, não o plano inteiro.
 *
 * Falha/tempo limite/ausência de chave → retorna null e o chamador mantém
 * o foco determinístico. O plano nunca depende da IA para existir.
 */

const FocosIASchema = z.object({
  focos: z.array(z.string().min(3).max(120)).min(1).max(52),
})

export function montarPromptFocos(concurso: PlanoConcurso, semanas: SemanaPlano[]) {
  const materias = concurso.materias
    .map((m) => `${m.materia} (peso ${m.peso})`)
    .join("; ")

  return `Você é um especialista em preparação para concursos públicos. Vou te dar um concurso-alvo e a sequência de semanas de estudo até a prova. Para cada semana, escreva um foco de estudo específico e útil (entre 3 e 120 caracteres), citando a matéria central e o subtema mais cobrado na banca.

Concurso: ${concurso.nome} (banca: ${concurso.banca ?? "a definir"})
Matérias com peso: ${materias}
Total de semanas: ${semanas.length}

Distribuição sugerida (primeiras semanas = fundamentos, meio = aprofundamento com questões, últimas = revisão e simulados). Responda APENAS JSON: {"focos":["foco da semana 1", "...", "..."]} com exatamente ${semanas.length} focos.`
}

/**
 * Tenta refinar os focos semanais com a IA. Retorna null em qualquer falha
 * (sem chave, timeout, JSON inválido, tamanho errado) — nunca lança.
 */
export async function refinarFocosComIA(
  concurso: PlanoConcurso,
  semanas: SemanaPlano[]
): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const openai = new OpenAI({ apiKey, timeout: 8000 })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um especialista em preparação para concursos e retorna apenas JSON válido." },
        { role: "user", content: montarPromptFocos(concurso, semanas) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return null

    const parsed = FocosIASchema.safeParse(JSON.parse(content))
    if (!parsed.success) return null
    if (parsed.data.focos.length !== semanas.length) return null

    return parsed.data.focos
  } catch (err) {
    console.error("Erro no refino de focos por IA, mantendo foco determinístico:", err)
    return null
  }
}