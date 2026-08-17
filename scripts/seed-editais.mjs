import { existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

// Seed de editais principais a partir do snapshot concursos-principais.md
// (ago/2026). Rodar após a migration 026 (status 'sem_edital').
// Uso: node scripts/seed-editais.mjs

const ROOT = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(ROOT, "..", ".env")
if (existsSync(ENV_PATH)) {
  try {
    process.loadEnvFile(ENV_PATH)
  } catch {
    // sem .env, usa apenas o ambiente já configurado
  }
}

// Status conforme hoje = 17/08/2026.
// - aberto: inscrições abertas agora
// - encerrado: inscrições fechadas e prova futura
// - previsto: sem edital publicado (autorizado / banca definida)
// - sem_edital: prova já realizada, sem edital novo (mostra dados da última edição)
const EDITAIS = [
  // ── Concursos gerais (federais) ─────────────────────────────
  {
    orgao: "Petrobras",
    cargo: "Técnico e Analista",
    banca: "Cesgranrio",
    area_concurso: "Concursos",
    vagas: 1100,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.cesgranrio.org.br/",
    status: "previsto",
  },
  {
    orgao: "Receita Federal",
    cargo: "Auditor e Analista-Tributário",
    banca: null,
    area_concurso: "Concursos",
    vagas: 146,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.gov.br/receitafederal/pt-br",
    status: "previsto",
  },
  {
    orgao: "Banco Central (Bacen)",
    cargo: "Procurador e Técnico",
    banca: null,
    area_concurso: "Concursos",
    vagas: 170,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.bcb.gov.br/",
    status: "previsto",
  },
  {
    orgao: "CGU",
    cargo: "Auditoria e Controle",
    banca: null,
    area_concurso: "Concursos",
    vagas: 120,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.gov.br/cgu/pt-br",
    status: "previsto",
  },
  {
    orgao: "ANPD",
    cargo: "Especialista em Proteção de Dados",
    banca: null,
    area_concurso: "Concursos",
    vagas: 50,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.gov.br/anpd/pt-br",
    status: "previsto",
  },
  {
    orgao: "PRF",
    cargo: "Policial Rodoviário Federal e Administrativo",
    banca: null,
    area_concurso: "Concursos",
    vagas: 533,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.gov.br/prf/pt-br",
    status: "previsto",
  },
  {
    orgao: "Correios",
    cargo: "Carteiro e Agente",
    banca: null,
    area_concurso: "Concursos",
    vagas: null,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.correios.com.br/",
    status: "previsto",
  },
  {
    orgao: "INSS",
    cargo: "Técnico do Seguro Social",
    banca: null,
    area_concurso: "Concursos",
    vagas: 10000,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.gov.br/inss/pt-br",
    status: "previsto",
  },

  // ── Concursos gerais (estaduais com banca definida) ─────────
  {
    orgao: "Polícia Civil do RJ",
    cargo: "Delegado, Perito e Demais Cargos",
    banca: "FGV",
    area_concurso: "Concursos",
    vagas: 329,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://conhecimento.fgv.br/concursos",
    status: "previsto",
  },
  {
    orgao: "Seduc PA",
    cargo: "Professor",
    banca: "FGV",
    area_concurso: "Concursos",
    vagas: 2000,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://conhecimento.fgv.br/concursos",
    status: "previsto",
  },
  {
    orgao: "PM SC",
    cargo: "Soldado",
    banca: "Instituto AOCP",
    area_concurso: "Concursos",
    vagas: 500,
    data_prova: null,
    data_inscricao_fim: null,
    link: "https://www.institutoaocp.org.br/",
    status: "previsto",
  },
  {
    orgao: "ABGF",
    cargo: "Cargos de Nível Superior",
    banca: "FCC",
    area_concurso: "Concursos",
    vagas: null,
    data_prova: null,
    data_inscricao_fim: "2026-08-11",
    link: "https://www.fundacaofcc.org.br/",
    status: "encerrado",
  },

  // ── OAB (Exame de Ordem Unificado) ───────────────────────────
  {
    orgao: "OAB — 46º Exame",
    cargo: "Exame de Ordem Unificado",
    banca: "FGV",
    area_concurso: "OAB",
    vagas: null,
    data_prova: "2026-05-03",
    data_inscricao_fim: "2026-02-09",
    link: "https://oab.fgv.br/arq/649/604111_46%20eou.%20edital%20de%20abertura..pdf",
    status: "sem_edital",
  },
  {
    orgao: "OAB — 47º Exame",
    cargo: "Exame de Ordem Unificado",
    banca: "FGV",
    area_concurso: "OAB",
    vagas: null,
    data_prova: "2026-09-06",
    data_inscricao_fim: "2026-06-08",
    link: "https://oab.fgv.br/arq/650/580490_47%C2%BA%20eou.%20edital%20de%20abertura.%20ponto%20para%20publicar.%20(2).pdf",
    status: "encerrado",
  },
  {
    orgao: "OAB — 48º Exame",
    cargo: "Exame de Ordem Unificado",
    banca: "FGV",
    area_concurso: "OAB",
    vagas: null,
    data_prova: "2027-01-10",
    data_inscricao_fim: "2026-10-05",
    link: "https://oab.fgv.br/",
    status: "previsto",
  },
  {
    orgao: "OAB — 49º Exame",
    cargo: "Exame de Ordem Unificado",
    banca: "FGV",
    area_concurso: "OAB",
    vagas: null,
    data_prova: "2027-05-09",
    data_inscricao_fim: "2027-02-05",
    link: "https://oab.fgv.br/",
    status: "previsto",
  },

  // ── Militar ──────────────────────────────────────────────────
  {
    orgao: "ITA 2026",
    cargo: "Curso de Graduação",
    banca: "Própria (ITA)",
    area_concurso: "Militar",
    vagas: 200,
    data_prova: "2026-09-27",
    data_inscricao_fim: "2026-07-12",
    link: "https://www.vestibular.ita.br/instrucoes/edital_2027.pdf",
    status: "encerrado",
  },
  {
    orgao: "IME 2026",
    cargo: "Curso de Formação de Graduados (CFG)",
    banca: "Própria (IME)",
    area_concurso: "Militar",
    vagas: 100,
    data_prova: "2026-09-20",
    data_inscricao_fim: "2026-07-08",
    link: "https://www.ime.eb.mil.br/vestibular-e-concursos/cfg-ensino-medio/inscricoes",
    status: "encerrado",
  },
  {
    orgao: "EsPCEx 2026",
    cargo: "Oficial — Curso de Formação",
    banca: "VUNESP",
    area_concurso: "Militar",
    vagas: 440,
    data_prova: "2026-09-12",
    data_inscricao_fim: "2026-06-16",
    link: "https://www.espccex.eb.mil.br/",
    status: "encerrado",
  },
  {
    orgao: "ESA 2026",
    cargo: "Sargento",
    banca: "Própria (Exército)",
    area_concurso: "Militar",
    vagas: 1100,
    data_prova: "2026-07-26",
    data_inscricao_fim: "2026-05-04",
    link: "https://www.esa.eb.mil.br/",
    status: "sem_edital",
  },
  {
    orgao: "AFA 2026",
    cargo: "Oficial — CFG",
    banca: "Própria (FAB)",
    area_concurso: "Militar",
    vagas: 55,
    data_prova: "2026-07-05",
    data_inscricao_fim: "2026-04-27",
    link: "https://ingresso.fab.mil.br/",
    status: "sem_edital",
  },
  {
    orgao: "EEAR 2026 (CFS 2/2026)",
    cargo: "Sargento — CFS",
    banca: "Própria (FAB)",
    area_concurso: "Militar",
    vagas: 235,
    data_prova: "2026-11-22",
    data_inscricao_fim: "2026-07-02",
    link: "https://ingresso.fab.mil.br/",
    status: "encerrado",
  },
  {
    orgao: "EFOMM 2026",
    cargo: "Oficial — Marinha Mercante",
    banca: "Própria (Marinha Mercante)",
    area_concurso: "Militar",
    vagas: null,
    data_prova: "2026-07-25",
    data_inscricao_fim: "2026-06-02",
    link: "https://www.marinha.mil.br/",
    status: "sem_edital",
  },
  {
    orgao: "Escola Naval 2026",
    cargo: "Oficial — CFN",
    banca: "Própria (Marinha)",
    area_concurso: "Militar",
    vagas: null,
    data_prova: "2026-08-29",
    data_inscricao_fim: "2026-05-13",
    link: "https://www.marinha.mil.br/",
    status: "encerrado",
  },
  {
    orgao: "Colégio Naval 2026",
    cargo: "Aluno do Ensino Médio",
    banca: "Própria (Marinha)",
    area_concurso: "Militar",
    vagas: null,
    data_prova: "2026-08-01",
    data_inscricao_fim: "2026-05-04",
    link: "https://www.marinha.mil.br/",
    status: "sem_edital",
  },
  {
    orgao: "EPCAR 2027",
    cargo: "Aluno do Ensino Médio",
    banca: "Própria (FAB)",
    area_concurso: "Militar",
    vagas: null,
    data_prova: "2026-06-21",
    data_inscricao_fim: "2026-03-23",
    link: "https://ingresso.fab.mil.br/",
    status: "sem_edital",
  },
  {
    orgao: "EsFCEx 2026",
    cargo: "Oficial (Saúde, QCO e Capelães)",
    banca: "Própria (Exército)",
    area_concurso: "Militar",
    vagas: 227,
    data_prova: "2026-07-12",
    data_inscricao_fim: "2026-06-12",
    link: "https://www.eb.mil.br/",
    status: "sem_edital",
  },

  // ── ENEM ─────────────────────────────────────────────────────
  {
    orgao: "ENEM 2026",
    cargo: null,
    banca: "INEP",
    area_concurso: "ENEM",
    vagas: null,
    data_prova: "2026-11-08",
    data_inscricao_fim: "2026-06-12",
    link: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem",
    status: "encerrado",
  },
]

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY")
  }

  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

  let ok = 0
  let precisamMigration = 0
  const erros = []

  for (const edital of EDITAIS) {
    const { data: existente } = await client
      .from("editais")
      .select("id")
      .eq("orgao", edital.orgao)
      .maybeSingle()

    const res = existente
      ? await client.from("editais").update(edital).eq("id", existente.id)
      : await client.from("editais").insert(edital)

    if (res.error) {
      const semMigration = res.error.code === "23514" || /check constraint/i.test(res.error.message)
      if (semMigration) {
        precisamMigration++
        console.log(`[precisa migration 026] ${edital.orgao} (status '${edital.status}')`)
      } else {
        erros.push(`${edital.orgao}: ${res.error.message}`)
      }
      continue
    }

    console.log(`[ok] ${edital.orgao} → ${edital.status}`)
    ok++
  }

  console.log(`\ntotal: ${ok} aplicados`)
  if (precisamMigration > 0) {
    console.log(`${precisamMigration} pendentes: rode a migration 026 (supabase/supabase-migration-026-editais-sem-edital.sql) no SQL Editor e rode este script de novo.`)
  }
  if (erros.length > 0) {
    console.error(`erros: ${erros.length}`)
    for (const e of erros) console.error(`  ${e}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})