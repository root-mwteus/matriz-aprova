import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

const ROOT = dirname(fileURLToPath(import.meta.url))

// Carrega .env da raiz do projeto (materiais/simulados -> raiz), se existir.
// Node >= 20.6 oferece process.loadEnvFile() sem dependência externa.
const ENV_PATH = join(dirname(ROOT), "..", ".env")
if (existsSync(ENV_PATH)) {
  try {
    process.loadEnvFile(ENV_PATH)
  } catch {
    // sem .env, usa apenas o ambiente já configurado
  }
}

const BATCH = 100
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
const LETRAS = ["A", "B", "C", "D", "E"]

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) arquivos(caminho, acc)
    else if (nome.endsWith(".json")) acc.push(caminho)
  }
  return acc
}

function validar(caderno, caminho) {
  if (!caderno.slug || !Array.isArray(caderno.questoes)) {
    throw new Error(`${caminho}: formato de caderno inválido`)
  }
  if (caderno.questoes.length !== caderno.quantidade) {
    throw new Error(`${caminho}: esperadas ${caderno.quantidade} questões, recebidas ${caderno.questoes.length}`)
  }

  const ordens = new Set()
  for (const [index, questao] of caderno.questoes.entries()) {
    const prefixo = `${caminho}, questão ${index + 1}`
    if (questao.ordem !== index + 1 || ordens.has(questao.ordem)) {
      throw new Error(`${prefixo}: ordem inválida`)
    }
    ordens.add(questao.ordem)
    if (!questao.enunciado || !Array.isArray(questao.alternativas) || questao.alternativas.length !== 5) {
      throw new Error(`${prefixo}: enunciado ou alternativas inválidos`)
    }
    if (questao.resposta_correta < 0 || questao.resposta_correta > 4) {
      throw new Error(`${prefixo}: gabarito fora do intervalo 0-4`)
    }
    if (!NIVEL.has(questao.nivel)) {
      throw new Error(`${prefixo}: nível inválido (${questao.nivel})`)
    }
    if (questao.origem === "adaptada" && !questao.fonte_url) {
      throw new Error(`${prefixo}: questão adaptada sem fonte_url`)
    }
    if (questao.origem === "inédita" && questao.fonte_url) {
      throw new Error(`${prefixo}: questão inédita não deve ter fonte_url`)
    }
  }
}

function normalizarAlternativas(alternativas) {
  return alternativas.map((alternativa, index) =>
    typeof alternativa === "string"
      ? { letra: LETRAS[index], texto: alternativa }
      : { letra: alternativa.letra ?? LETRAS[index], texto: alternativa.texto ?? "" }
  )
}

function lerCadernos() {
  return arquivos(ROOT).map((caminho) => {
    const caderno = JSON.parse(readFileSync(caminho, "utf8"))
    validar(caderno, caminho)
    return caderno
  })
}

async function inserirEmLotes(client, tabela, rows, options) {
  const resultado = []
  for (let i = 0; i < rows.length; i += BATCH) {
    const lote = rows.slice(i, i + BATCH)
    const { data, error } = await client.from(tabela).upsert(lote, options).select()
    if (error) throw error
    resultado.push(...(data ?? []))
  }
  return resultado
}

async function main() {
  const cadernos = lerCadernos()
  if (process.argv.includes("--validate")) {
    const total = cadernos.reduce((soma, caderno) => soma + caderno.questoes.length, 0)
    console.log(`válido: ${cadernos.length} cadernos, ${total} questões`)
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
  }

  const slugs = cadernos.map((caderno) => caderno.slug)
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: catalogos, error: catalogosError } = await client
    .from("simulados_catalogo")
    .select("id, slug")
    .in("slug", slugs)
  if (catalogosError) throw catalogosError

  const porSlug = new Map((catalogos ?? []).map((catalogo) => [catalogo.slug, catalogo.id]))
  const ausentes = slugs.filter((slug) => !porSlug.has(slug))
  if (ausentes.length) {
    throw new Error(`Catálogos ausentes. Rode antes a migration 024: ${ausentes.join(", ")}`)
  }

  let totalQuestoes = 0
  let totalVinculos = 0
  for (const caderno of cadernos) {
    const simuladoId = porSlug.get(caderno.slug)
    const rows = caderno.questoes.map((questao) => ({
      codigo_importacao: `${caderno.slug}:${questao.ordem}`,
      materia: questao.materia,
      sub_materia: questao.sub_materia ?? null,
      banca: questao.banca ?? null,
      ano: questao.ano ?? null,
      nivel: NIVEL.get(questao.nivel),
      area_concurso: caderno.area,
      enunciado: questao.enunciado,
      texto_referencia: questao.texto_referencia ?? null,
      mostrar_texto: Boolean(questao.texto_referencia),
      alternativas: normalizarAlternativas(questao.alternativas),
      resposta_correta: questao.resposta_correta,
      explicacao: questao.explicacao,
      referencias: Array.isArray(questao.referencias) ? questao.referencias.join("; ") : questao.referencias ?? null,
      origem: questao.origem,
      fonte_url: questao.fonte_url ?? null,
    }))
    const inseridas = await inserirEmLotes(client, "questions", rows, { onConflict: "codigo_importacao" })
    const porCodigo = new Map(inseridas.map((questao) => [questao.codigo_importacao, questao.id]))
    const vinculos = caderno.questoes.map((questao) => ({
      simulado_id: simuladoId,
      question_id: porCodigo.get(`${caderno.slug}:${questao.ordem}`),
      ordem: questao.ordem,
    }))
    if (vinculos.some((vinculo) => !vinculo.question_id)) {
      throw new Error(`Não foi possível recuperar IDs de ${caderno.slug}`)
    }
    await inserirEmLotes(client, "simulados_catalogo_questoes", vinculos, {
      onConflict: "simulado_id,question_id",
    })
    totalQuestoes += rows.length
    totalVinculos += vinculos.length
    console.log(`importado: ${caderno.slug} (${rows.length} questões)`)
  }

  console.log(`total: ${cadernos.length} cadernos, ${totalQuestoes} questões, ${totalVinculos} vínculos`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
