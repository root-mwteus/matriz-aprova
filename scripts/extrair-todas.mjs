import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join, relative, basename } from "node:path"
try { if (existsSync(join(process.cwd(), ".env"))) process.loadEnvFile(join(process.cwd(), ".env")) } catch {}
import { extrairTextoDePdf } from "../src/lib/importar-questoes/extract-pdf.ts"
import { QuestaoExtraidaSchema } from "../src/lib/importar-questoes/schema.ts"
import { chunkTexto, dedupePorEnunciado } from "../src/lib/importar-questoes/chunk.ts"
import { parseChunksComIA } from "../src/lib/importar-questoes/parse-ia.ts"

const ROOT = process.cwd()
const PROVAS_DIR = join(ROOT, "provas")
const OUT_DIR = join(PROVAS_DIR, "_extraidas")
const MASTER_JSON = join(OUT_DIR, "_todas.json")
const RELATORIO = join(OUT_DIR, "_relatorio.md")

const MATERIAS = ["Português","Matemática","Direito Constitucional","Direito Administrativo","Informática","Raciocínio Lógico","História","Geografia","Atualidades","Legislação","Direito Penal","Direito Civil"]

function coletarPdfs(dir, acc=[]) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (e.startsWith("_") || e.startsWith(".")) continue
    if (statSync(p).isDirectory()) coletarPdfs(p, acc)
    else if (p.endsWith(".pdf")) acc.push(p)
  }
  return acc
}

// Fallback determinístico para PDFs sintéticos gerados por gerar-provas-sinteticas.mjs
// pdfjs extrai como linha única com "A) ... B) ... Gabarito: X" inline, então
// regex busca alternativas inline, não por quebra de linha.
function parseSintetico(texto, fonte) {
  const questoes = []
  const blocos = texto.split(/QUEST[ÃA]O\s+\d+\s*[—\-–]*/i)
  // primeiro bloco é cabeçalho, ignora
  for (let i=1; i<blocos.length; i++) {
    const blocoRaw = blocos[i] || ""
    if (!blocoRaw.trim()) continue
    // matéria: procura qual MATERIA aparece nos primeiros 120 chars
    const inicio = blocoRaw.slice(0, 200).toLowerCase()
    let materia = "Direito Constitucional"
    for (const m of MATERIAS) {
      if (inicio.includes(m.toLowerCase().slice(0, 5))) { materia = m; break; }
    }
    // alternativas inline: "A) ... B) ... Gabarito: X"
    const alts = []
    const altRegex = /\b([A-E])[\)\.]\s*([^]*?)(?=\s+[A-E][\)\.]|\s*Gabarito:|$)/g
    let m
    while ((m = altRegex.exec(blocoRaw)) !== null) {
      const letra = m[1]
      let txt = (m[2] || "").trim().replace(/\s+/g, " ")
      // remove rastro de próxima questão se houver
      txt = txt.split("QUEST")[0].trim()
      if (txt) alts.push({ letra, texto: txt.slice(0, 200) })
      if (alts.length >= 5) break
    }
    if (alts.length !== 5) continue
    // enunciado: texto antes do primeiro "A)" até 300 chars, remove matéria do início
    const idxA = blocoRaw.search(/\bA[\)\.]\s/)
    let enunciado = idxA > 0 ? blocoRaw.slice(0, idxA).trim().replace(/\s+/g, " ") : ""
    // remove matéria duplicada no início ("Direito Civil Em relação...")
    if (enunciado.toLowerCase().startsWith(materia.toLowerCase())) {
      enunciado = enunciado.slice(materia.length).trim()
    }
    // limpa prefixos como "—" ou "–"
    enunciado = enunciado.replace(/^[—\-–\s]+/, "").trim()
    if (!enunciado || enunciado.length < 10) enunciado = `Questão ${i} de ${materia}`
    if (enunciado.length > 500) enunciado = enunciado.slice(0, 500)
    const gabMatch = blocoRaw.match(/Gabarito:\s*([A-E])/i)
    const gab = gabMatch ? gabMatch[1] : null
    const ordem = questoes.length + 1
    const idx = gab ? "ABCDE".indexOf(gab) : null
    const q = {
      ordem,
      materia,
      sub_materia: null,
      banca: "CESPE/CEBRASPE",
      ano: 2023,
      nivel: "medio",
      enunciado,
      texto_referencia: null,
      alternativas: alts,
      resposta_correta: idx !== null && idx >=0 ? idx : null,
      explicacao: null,
      referencias: [],
      origem: "inédita",
      fonte_url: null,
      confianca: idx !== null ? 0.95 : 0.5,
      figuras: [],
    }
    const parsed = QuestaoExtraidaSchema.safeParse(q)
    if (parsed.success) questoes.push(parsed.data)
  }
  return questoes
}

async function extrairUm(caminho) {
  const rel = relative(PROVAS_DIR, caminho)
  const fonte = `pdf:${rel}`
  const buf = readFileSync(caminho)
  let texto = ""
  try {
    const r = await extrairTextoDePdf(buf)
    texto = r.texto
  } catch (e) {
    return { rel, erro: `Falha pdfjs: ${e.message}`, questoes: [] }
  }
  if (!texto.trim()) return { rel, erro: "Texto vazio (PDF escaneado?)", questoes: [] }

  // 1. tenta parser sintético rápido (sem IA, sem custo)
  const sinteticas = parseSintetico(texto, fonte)
  if (sinteticas.length >= 8) {
    return { rel, fonte, textoChars: texto.length, questoes: sinteticas, metodo: "regex-sintetico" }
  }

  // 2. senão, usa IA (custo) — para PDFs reais (Cebraspe/FGV)
  if (!process.env.OPENAI_API_KEY) {
    return { rel, erro: "Sem OPENAI_API_KEY e não é sintético — precisa IA", questoes: sinteticas, textoChars: texto.length, metodo: "regex-fallback" }
  }
  try {
    const ia = await parseChunksComIA(texto, { fonte, fonteUrl: null, bancaHint: null })
    return { rel, fonte, textoChars: texto.length, questoes: ia.questoes, metodo: `ia-${ia.chunks}chunks`, custo: ia.custoEstimadoTokens }
  } catch (e) {
    return { rel, erro: `IA: ${e.message}`, questoes: sinteticas, textoChars: texto.length, metodo: "regex-fallback" }
  }
}

async function main() {
  const pdfs = coletarPdfs(PROVAS_DIR).sort()
  console.log(`Encontrados ${pdfs.length} PDFs em provas/`)
  if (!pdfs.length) { console.error("Nenhum PDF em provas/"); process.exit(1) }

  mkdirSync(OUT_DIR, { recursive: true })
  const todos = []
  const relatorio = []
  let totalErros = 0
  let totalSemGabarito = 0
  let totalBaixaConfianca = 0
  let totalTokens = 0

  for (let i=0; i<pdfs.length; i++) {
    const caminho = pdfs[i]
    const rel = relative(PROVAS_DIR, caminho)
    process.stdout.write(`[${i+1}/${pdfs.length}] ${rel} ... `)
    const r = await extrairUm(caminho)
    if (r.erro) {
      console.log(`ERRO: ${r.erro} (${r.questoes.length} via fallback)`)
      totalErros++
      relatorio.push(`- **${rel}**: ERRO — ${r.erro} — ${r.questoes.length} questão(ões) via fallback`)
    } else {
      console.log(`${r.questoes.length} questões via ${r.metodo} (${r.textoChars} chars)`)
      relatorio.push(`- ${rel}: ${r.questoes.length} questões via ${r.metodo}`)
    }
    if (r.custo) totalTokens += r.custo
    totalSemGabarito += r.questoes.filter(q=> q.resposta_correta===null).length
    totalBaixaConfianca += r.questoes.filter(q=> q.confianca <0.7).length

    // salva per-file
    const base = basename(rel).replace(/\.pdf$/i,"")
    writeFileSync(join(OUT_DIR, `${base}.json`), JSON.stringify(r.questoes, null, 2))

    // acumula com ordem global
    for (const q of r.questoes) {
      todos.push({ ...q, _fonte: rel })
    }

    // pausa leve para não estourar rate limit da OpenAI (só quando usou IA)
    if (r.metodo?.startsWith("ia-")) await new Promise(r=> setTimeout(r, 800))
  }

  // dedupe global por enunciado (overlap entre chunks/pdfs)
  const antes = todos.length
  const deduped = dedupePorEnunciado(todos.map((q, idx)=> ({...q, ordem: idx+1})))
  const duplicatas = antes - deduped.length

  // reordena ordem sequencial
  const final = deduped.map((q, idx)=> ({...q, ordem: idx+1}))

  // valida tudo
  const invalidas = final.filter(q=> !QuestaoExtraidaSchema.safeParse(q).success)

  writeFileSync(MASTER_JSON, JSON.stringify(final, null, 2))

  const md = `# Relatório de extração — ${new Date().toISOString()}

Total PDFs: ${pdfs.length}
Total questões extraídas (bruto): ${antes}
Deduplicadas (Jaccard 0.92): ${deduped.length} (removidas ${duplicatas})
Inválidas no schema: ${invalidas.length}
Sem gabarito (revisão obrigatória): ${totalSemGabarito}
Baixa confiança (<0.7): ${totalBaixaConfianca}
Com erro de extração: ${totalErros}
Custo estimado tokens (IA): ${totalTokens}

## Por arquivo
${relatorio.join("\n")}

## Próximos passos
1. Revise \`provas/_extraidas/_todas.json\` (preview) — corrija \`resposta_correta: null\` e \`confianca <0.7\`.
2. Rode \`node scripts/importar-extraidas.mjs\` (dry-run) para validar sem gravar.
3. Rode \`node scripts/importar-extraidas.mjs --confirm\` para \`upsert(codigo_importacao)\` — idempotente.
4. Ou use \`/admin/questoes/importar\` e cole \`_todas.json\` no preview e clique Confirmar.

> Dica: PDFs reais (Cebraspe/FGV) precisam de \`OPENAI_API_KEY\`; sintéticos já extraídos via regex sem custo.
`
  writeFileSync(RELATORIO, md)
  console.log(`\n---\n${md}\n---`)
  console.log(`\nSalvos: ${MASTER_JSON} (${final.length} questões)`)
  console.log(`Relatório: ${RELATORIO}`)
  if (invalidas.length) console.warn(`\nATENÇÃO: ${invalidas.length} inválidas — revise antes do --confirm`)
}

main().catch(e=>{ console.error(e); process.exit(1) })
