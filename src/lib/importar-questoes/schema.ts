import { z } from "zod"
import { MATERIAS, BANCAS } from "@/lib/constants"

// Schema de extração do extrator.md: espelha o formato que importar-simulados.mjs
// persiste (5 alternativas A-E, resposta_correta 0-4 ou null, origem pública/inédita/adaptada).
// `resposta_correta: null` força revisão humana no preview antes do upsert.

const AlternativaSchema = z.object({
  letra: z.enum(["A", "B", "C", "D", "E"]),
  texto: z.string().min(1).max(5000),
})

export const QuestaoExtraidaSchema = z.object({
  ordem: z.number().int().min(1).optional().default(1),
  materia: z.string().min(1),
  sub_materia: z.string().nullable().optional().default(null),
  banca: z.string().nullable().optional().default(null),
  ano: z.number().int().min(1990).max(2030).nullable().optional().default(null),
  nivel: z.enum(["facil", "medio", "dificil"]).nullable().optional().default(null),
  enunciado: z.string().min(10).max(8000),
  texto_referencia: z.string().nullable().optional().default(null),
  alternativas: z.array(AlternativaSchema).length(5),
  resposta_correta: z.number().int().min(0).max(4).nullable().optional().default(null),
  explicacao: z.string().nullable().optional().default(null),
  referencias: z.array(z.string()).default([]),
  origem: z.enum(["pública", "inédita", "adaptada"]).nullable().optional().default("adaptada"),
  fonte_url: z.string().url().nullable().optional().default(null),
  confianca: z.number().min(0).max(1).optional().default(0.5),
  figuras: z.array(z.object({ legenda: z.string().nullable() })).default([]),
})

export type QuestaoExtraida = z.infer<typeof QuestaoExtraidaSchema>

export const RespostaIASchema = z.object({
  questoes: z.array(QuestaoExtraidaSchema),
})

export type RespostaIA = z.infer<typeof RespostaIASchema>

export function parseQuestaoExtraida(input: unknown) {
  return QuestaoExtraidaSchema.safeParse(input)
}
