import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { getSessionUser } from "@/lib/supabase/auth"
import { QuestaoExtraidaSchema } from "@/lib/importar-questoes/schema"
import { paraQuestionRow, codigoImportacao, hashFonte } from "@/lib/importar-questoes/normalize"
import { z } from "zod"

export const dynamic = "force-dynamic"

const BodySchema = z.object({
  jobId: z.string().uuid().nullable().optional(),
  questoes: z.array(QuestaoExtraidaSchema),
  areaConcurso: z.string().nullable().optional(),
  simuladoId: z.string().uuid().nullable().optional(),
})

/**
 * POST /api/admin/questoes/importar/confirmar
 *
 * Recebe `questoes[]` já revisadas no preview (admin editou LaTeX, corrigiu
 * gabarito, conferiu banca/materia). Valida com zod de novo, converte com
 * `paraQuestionRow` (mesma normalização de importar-simulados.mjs) e faz
 * `upsert(onConflict: codigo_importacao)`. Opcionalmente vincula ao
 * `simulados_catalogo` quando `simuladoId` é passado.
 * Retorna contagem inserida/atualizada e lista de `codigo_importacao`.
 */
export async function POST(request: Request) {
  const session = await getSessionUser()
  if (!session || session.suspenso || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
  }
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", issues: parsed.error.issues.slice(0, 5) }, { status: 400 })
  }

  const { questoes, areaConcurso, simuladoId, jobId } = parsed.data
  if (!questoes.length) return NextResponse.json({ error: "Nenhuma questão para importar" }, { status: 400 })

  // Valida cada questão já no formato do schema (resposta_correta null já barrada antes)
  const fonte = `import:${hashFonte(JSON.stringify(questoes.slice(0, 2).map((q) => q.enunciado).join("|")))}`
  const rows: ReturnType<typeof paraQuestionRow>[] = []
  const erros: { ordem: number; motivo: string }[] = []

  for (const q of questoes) {
    const row = paraQuestionRow(q, fonte, areaConcurso ?? null)
    if (!row) {
      erros.push({
        ordem: q.ordem,
        motivo: q.resposta_correta === null ? "Sem gabarito (preencha antes de confirmar)" : "Alternativa vazia ou nível inválido",
      })
    } else {
      // Garante codigo_importacao único por job (usa fonte do job se houver)
      if (jobId) row.codigo_importacao = codigoImportacao(jobId, q.ordem)
      rows.push(row)
    }
  }

  if (erros.length) {
    return NextResponse.json({ error: "Algumas questões não passaram na validação", erros }, { status: 400 })
  }

  // Upsert em lotes de 100 (mesmo BATCH de importar-simulados.mjs)
  const BATCH = 100
  const inseridas: { id: string; codigo_importacao: string }[] = []
  for (let i = 0; i < rows.length; i += BATCH) {
    const lote = rows.slice(i, i + BATCH).filter(Boolean) as NonNullable<(typeof rows)[number]>[]
    const { data, error } = await admin
      .from("questions")
      .upsert(lote as never, { onConflict: "codigo_importacao" })
      .select("id, codigo_importacao")
    if (error) return NextResponse.json({ error: `Falha ao gravar: ${error.message}` }, { status: 500 })
    inseridas.push(...((data as unknown as typeof inseridas) ?? []))
  }

  // Vínculo opcional a caderno
  if (simuladoId && inseridas.length) {
    const vinculos = inseridas.map((q, idx) => ({
      simulado_id: simuladoId,
      question_id: q.id,
      ordem: idx + 1,
    }))
    for (let i = 0; i < vinculos.length; i += BATCH) {
      const lote = vinculos.slice(i, i + BATCH)
      const { error } = await admin.from("simulados_catalogo_questoes").upsert(lote as never, {
        onConflict: "simulado_id,question_id",
      })
      if (error) return NextResponse.json({ error: `Falha ao vincular caderno: ${error.message}` }, { status: 500 })
    }
  }

  // Atualiza auditoria
  if (jobId) {
    try {
      await admin
        .from("importacoes_questoes")
        .update({ status: "done", total_confirmadas: inseridas.length, updated_at: new Date().toISOString() })
        .eq("id", jobId)
    } catch {
      // tabela pode não existir em dev — ignora
    }
  }

  return NextResponse.json({ ok: true, total: inseridas.length, questoes: inseridas })
}
