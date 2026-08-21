import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { QuestaoExtraidaSchema } from "../src/lib/importar-questoes/schema.ts"
import { paraQuestionRow } from "../src/lib/importar-questoes/normalize.ts"

const MASTER = join(process.cwd(), "provas", "_extraidas", "_todas.json")
const DRY = !process.argv.includes("--confirm")

function loadEnv() {
  try { process.loadEnvFile(join(process.cwd(), ".env")) } catch {}
}

async function main() {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env")
    process.exit(1)
  }
  if (!readFileSync) {}
  let raw
  try { raw = readFileSync(MASTER, "utf8") } catch { console.error(`Não encontrou ${MASTER} — rode primeiro: node scripts/extrair-todas.mjs`); process.exit(1) }
  const questoes = JSON.parse(raw)
  console.log(`Carregadas ${questoes.length} questões de ${MASTER}`)

  // valida todas
  const erros = []
  for (let i=0; i<questoes.length; i++) {
    const r = QuestaoExtraidaSchema.safeParse(questoes[i])
    if (!r.success) erros.push({ idx: i+1, issues: r.error.issues.slice(0,2).map(x=> x.message).join("; ") })
  }
  if (erros.length) {
    console.error(`\n${erros.length} inválidas (exemplos):`, erros.slice(0,5))
    console.error("Corrija o JSON antes do --confirm")
    process.exit(1)
  }

  const semGabarito = questoes.filter(q=> q.resposta_correta===null).length
  if (semGabarito) {
    console.error(`\n${semGabarito} questão(ões) sem gabarito (resposta_correta: null) — preencha antes do --confirm (preview obrigatório)`)
    if (DRY) console.log("(dry-run: não gravou por haver sem gabarito)")
    else { console.error("Abortado: corrija gabaritos em _todas.json"); process.exit(1) }
  }

  // normaliza para rows (mesma lógica do /api/confirmar)
  const fonte = `import:batch:${new Date().toISOString().slice(0,10)}`
  const rows = []
  const falhas = []
  for (const q of questoes) {
    const row = paraQuestionRow(q, fonte, null)
    if (!row) falhas.push({ ordem: q.ordem, materia: q.materia })
    else rows.push(row)
  }
  console.log(`\nNormalizadas: ${rows.length} válidas, ${falhas.length} falhas (alternativa vazia/nivel)`)
  if (falhas.length) console.log(falhas.slice(0,5))

  if (DRY) {
    console.log(`\n[DRY-RUN] Não gravou. Rode com --confirm para upsert ${rows.length} em questions (BATCH 100, onConflict codigo_importacao)`)
    console.log(`Exemplo codigo_importacao: ${rows[0]?.codigo_importacao}`)
    return
  }

  const supabase = createClient(url, key)
  const BATCH = 100
  let ok = 0
  for (let i=0; i<rows.length; i+=BATCH) {
    const lote = rows.slice(i, i+BATCH)
    const { data, error } = await supabase.from("questions").upsert(lote, { onConflict: "codigo_importacao" }).select("id")
    if (error) { console.error(`Erro no lote ${i/BATCH+1}:`, error.message); process.exit(1) }
    ok += data?.length ?? 0
    console.log(`Lote ${i/BATCH+1}: ${data?.length} ok`)
  }
  console.log(`\n✓ Importadas ${ok}/${rows.length} (upsert idempotente)`)

  // opcional: atualiza importacoes_questoes se existir
  try {
    const { data: admin } = await supabase.from("profiles").select("id").eq("role","admin").limit(1).maybeSingle()
    if (admin) {
      await supabase.from("importacoes_questoes").insert({
        admin_id: (admin as {id:string}).id,
        fonte_tipo: "pdf",
        arquivo_path: "provas/_extraidas/_todas.json",
        status: "done",
        total_extraidas: questoes.length,
        total_confirmadas: ok,
      })
    }
  } catch {}
}

main().catch(e=>{ console.error(e); process.exit(1) })
