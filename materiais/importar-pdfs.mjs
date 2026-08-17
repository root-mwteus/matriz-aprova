import { readFileSync, readdirSync, statSync, existsSync } from "node:fs"
import { join, dirname, extname } from "node:path"
import { fileURLToPath } from "node:url"
import { inflateSync } from "node:zlib"
import { createClient } from "@supabase/supabase-js"

const ROOT = dirname(fileURLToPath(import.meta.url))

// Carrega .env da raiz do projeto (materiais -> raiz), se existir.
const ENV_PATH = join(ROOT, "..", ".env")
if (existsSync(ENV_PATH)) {
  try {
    process.loadEnvFile(ENV_PATH)
  } catch {
    // sem .env, usa apenas o ambiente já configurado
  }
}

// Pasta de destino no bucket `materiais`. Cada apostila vai para
// `apostilas/<disciplina>/<arquivo>.pdf` — caminho estável e idempotente.
const DESTINO = "apostilas"

// Metadados curados de cada apostila. A chave é o caminho relativo ao
// diretório materiais (ex.: portugues/interpretacao-de-texto.pdf).
const APOSTILAS = {
  "portugues/interpretacao-de-texto.pdf": {
    titulo: "Interpretação de Texto",
    materia: "Português",
    sub_materia: "Interpretação de texto",
    incidencia: 90,
  },
  "portugues/gramatica-aplicada.pdf": {
    titulo: "Gramática Aplicada",
    materia: "Português",
    sub_materia: "Gramática aplicada",
    incidencia: 85,
  },
  "portugues/portugues-completo.pdf": {
    titulo: "Português Completo",
    materia: "Português",
    sub_materia: null,
    incidencia: 90,
  },
  "matematica/matematica-geral.pdf": {
    titulo: "Matemática Geral",
    materia: "Matemática",
    sub_materia: null,
    incidencia: 80,
  },
  "direito-constitucional/principios-fundamentais.pdf": {
    titulo: "Princípios Fundamentais",
    materia: "Direito Constitucional",
    sub_materia: "Princípios fundamentais",
    incidencia: 92,
  },
  "direito-administrativo/principios-da-administracao-publica.pdf": {
    titulo: "Princípios da Administração Pública",
    materia: "Direito Administrativo",
    sub_materia: "Princípios da Administração Pública",
    incidencia: 90,
  },
  "informatica/seguranca-da-informacao.pdf": {
    titulo: "Segurança da Informação",
    materia: "Informática",
    sub_materia: "Segurança da informação",
    incidencia: 82,
  },
  "raciocinio-logico/proposicoes-e-conectivos.pdf": {
    titulo: "Proposições e Conectivos",
    materia: "Raciocínio Lógico",
    sub_materia: "Proposições e conectivos",
    incidencia: 80,
  },
  "direito-penal/principios-e-aplicacao-da-lei-penal.pdf": {
    titulo: "Princípios e Aplicação da Lei Penal",
    materia: "Direito Penal",
    sub_materia: "Princípios e aplicação da lei penal",
    incidencia: 88,
  },
  "direito-processual-penal/inquerito-policial.pdf": {
    titulo: "Inquérito Policial",
    materia: "Direito Processual Penal",
    sub_materia: "Inquérito policial",
    incidencia: 78,
  },
  "fisica/cinematica-e-dinamica.pdf": {
    titulo: "Cinemática e Dinâmica",
    materia: "Física",
    sub_materia: "Cinemática e dinâmica",
    incidencia: 70,
  },
  "quimica/fundamentos-e-estequiometria.pdf": {
    titulo: "Fundamentos e Estequiometria",
    materia: "Química",
    sub_materia: "Fundamentos e estequiometria",
    incidencia: 70,
  },
  "direito-do-trabalho/relacao-de-emprego.pdf": {
    titulo: "Relação de Emprego",
    materia: "Direito do Trabalho",
    sub_materia: "Relação de emprego",
    incidencia: 75,
  },
  "direito-tributario/principios-e-limitacoes.pdf": {
    titulo: "Princípios e Limitações ao Poder de Tributar",
    materia: "Direito Tributário",
    sub_materia: "Princípios e limitações ao poder de tributar",
    incidencia: 75,
  },
  "redacao/texto-dissertativo-argumentativo-enem.pdf": {
    titulo: "Texto Dissertativo-Argumentativo (ENEM)",
    materia: "Redação",
    sub_materia: "Texto dissertativo-argumentativo",
    incidencia: 85,
  },
  "direito-previdenciario/beneficios-e-regras-gerais.pdf": {
    titulo: "Benefícios e Regras Gerais do RGPS",
    materia: "Direito Previdenciário",
    sub_materia: "Benefícios e regras gerais do RGPS",
    incidencia: 72,
  },
  "contabilidade/patrimonio-e-equacao-contabil.pdf": {
    titulo: "Patrimônio e Equação Contábil",
    materia: "Contabilidade",
    sub_materia: "Patrimônio e equação contábil",
    incidencia: 65,
  },
}

function arquivos(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) {
      if (nome === "simulados") continue
      arquivos(caminho, acc)
    } else if (nome.toLowerCase().endsWith(".pdf")) {
      acc.push(caminho)
    }
  }
  return acc
}

// Conta páginas olhando os objetos /Type /Page. Em PDFs do XeLaTeX os
// objetos ficam comprimidos em ObjStm, então também infla os streams
// (zlib nativo) antes de contar. Retorna null se não conseguir extrair.
const PAGE_RE = /\/Type\s*\/Page(?![s])/g
const OBJSTM_RE = /\/Type\s*\/ObjStm[\s\S]*?stream\r?\n([\s\S]*?)endstream/g

function contarPaginas(caminho) {
  try {
    const bruto = readFileSync(caminho, "latin1")
    let total = bruto.match(PAGE_RE)?.length ?? 0

    for (const match of bruto.matchAll(OBJSTM_RE)) {
      try {
        const inflado = inflateSync(Buffer.from(match[1], "latin1")).toString("latin1")
        total += inflado.match(PAGE_RE)?.length ?? 0
      } catch {
        // stream não-deflatável: ignora
      }
    }

    return total > 0 ? total : null
  } catch {
    return null
  }
}

function listar() {
  return arquivos(ROOT).flatMap((caminho) => {
    const relativo = caminho.replace(ROOT + "\\", "").replaceAll("\\", "/")
    const meta = APOSTILAS[relativo]
    if (!meta) {
      console.warn(`ignorado (sem metadados em APOSTILAS): ${relativo}`)
      return []
    }
    return [{ caminho, relativo, meta, paginas: contarPaginas(caminho) }]
  })
}

function caminhoDestino(relativo) {
  const semExt = relativo.slice(0, -extname(relativo).length)
  return `${DESTINO}/${semExt}.pdf`
}

// Lista as colunas reais da tabela `materials` via OpenAPI do PostgREST.
// O schema pode estar desatualizado no banco (ex.: sem sub_materia/ia_recommend
// se a migration 003 não rodou) — grava apenas o que existe.
async function colunasDeMateriais(url, key) {
  const resposta = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!resposta.ok) throw new Error(`falha ao ler schema (${resposta.status})`)
  const spec = await resposta.json()
  return new Set(Object.keys(spec.definitions?.materials?.properties ?? {}))
}

function ajustarLinha(linha, colunas) {
  return Object.fromEntries(Object.entries(linha).filter(([chave]) => colunas.has(chave)))
}

async function garantirBucket(client) {
  const { data, error } = await client.storage.getBucket("materiais")
  if (data) return
  if (error?.message?.toLowerCase().includes("not found") || error?.statusCode === 404) {
    const { error: criar } = await client.storage.createBucket("materiais", { public: false })
    if (criar) throw criar
    return
  }
  if (error) throw error
}

async function main() {
  const apostilas = listar()

  if (process.argv.includes("--validate")) {
    console.log(`válido: ${apostilas.length} apostilas`)
    for (const a of apostilas) {
      console.log(`  ${a.relativo} → ${a.meta.titulo} (${a.paginas ?? "?"} páginas) → ${caminhoDestino(a.relativo)}`)
    }
    return
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
  }

  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  await garantirBucket(client)
  const colunas = await colunasDeMateriais(url, key)

  for (const a of apostilas) {
    const destino = caminhoDestino(a.relativo)
    const arquivo = readFileSync(a.caminho)

    const { error: uploadError } = await client.storage.from("materiais").upload(destino, arquivo, {
      contentType: "application/pdf",
      upsert: true,
    })
    if (uploadError) throw new Error(`upload de ${a.relativo}: ${uploadError.message}`)

    const linha = ajustarLinha(
      {
        titulo: a.meta.titulo,
        materia: a.meta.materia,
        sub_materia: a.meta.sub_materia,
        banca: null,
        professor: null,
        paginas: a.paginas,
        pdf_url: destino,
        incidencia_pct: a.meta.incidencia,
        ia_recommend: a.meta.incidencia >= 85,
      },
      colunas
    )

    const { data: existente } = await client.from("materials").select("id").eq("pdf_url", destino).maybeSingle()
    let salvarError
    if (existente) {
      const { error } = await client.from("materials").update(linha).eq("id", existente.id)
      salvarError = error
    } else {
      const { error } = await client.from("materials").insert(linha)
      salvarError = error
    }
    if (salvarError) throw new Error(`materials de ${a.relativo}: ${salvarError.message}`)

    console.log(`importado: ${a.relativo} → ${destino} (${a.paginas ?? "?"} páginas)`)
  }

  console.log(`total: ${apostilas.length} apostilas importadas`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})