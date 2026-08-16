import { AREAS, MATERIAS } from "@/lib/constants"

/**
 * Curadoria de concursos-alvo.
 *
 * Cada plano define as matérias cobradas com peso relativo (quanto maior,
 * mais frequência no cronograma). A fonte é o snapshot de concursos
 * `concursos-principais.md` — a lista aqui é o ponto de partida do
 * gerador; o que não está curado cai no `PLANO_PADRAO` genérico.
 */

export interface MateriaPeso {
  materia: string
  peso: number
}

export interface PlanoConcurso {
  /** Slug único, usado como id do plano. */
  id: string
  nome: string
  area: (typeof AREAS)[number]
  banca?: string
  materias: MateriaPeso[]
  descricao: string
}

export const CONCURSOS: PlanoConcurso[] = [
  // ── Concursos Gerais ──────────────────────────────────────────────
  {
    id: "receita-federal",
    nome: "Receita Federal",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Direito Tributário", peso: 5 },
      { materia: "Contabilidade", peso: 4 },
      { materia: "Português", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Estatística", peso: 2 },
      { materia: "Informática", peso: 2 },
    ],
    descricao: "Auditor e Analista Tributário — carreira fiscal de nível superior.",
  },
  {
    id: "banco-central",
    nome: "Banco Central",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Economia", peso: 5 },
      { materia: "Finanças", peso: 4 },
      { materia: "Contabilidade", peso: 3 },
      { materia: "Estatística", peso: 3 },
      { materia: "Português", peso: 2 },
      { materia: "Direito Constitucional", peso: 2 },
      { materia: "Direito Administrativo", peso: 2 },
      { materia: "Informática", peso: 2 },
      { materia: "Inglês", peso: 1 },
    ],
    descricao: "Especialista — área econômico-financeira de carreira de Estado.",
  },
  {
    id: "cgu",
    nome: "CGU",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Direito Financeiro", peso: 4 },
      { materia: "Contabilidade", peso: 4 },
      { materia: "Auditoria", peso: 4 },
      { materia: "Português", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Informática", peso: 2 },
    ],
    descricao: "Auditor Federal de Finanças e Controle — controle interno do Executivo.",
  },
  {
    id: "prf",
    nome: "PRF",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Legislação", peso: 4 },
      { materia: "Direito Penal", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Português", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 3 },
      { materia: "Informática", peso: 2 },
      { materia: "Direitos Humanos", peso: 2 },
    ],
    descricao: "Policial Rodoviário Federal — carreira policial de nível superior.",
  },
  {
    id: "policia-federal",
    nome: "Polícia Federal",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Direito Penal", peso: 4 },
      { materia: "Direito Processual Penal", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Português", peso: 3 },
      { materia: "Informática", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Direitos Humanos", peso: 2 },
    ],
    descricao: "Agente, Escrivão e Papiloscopista — investigação federal.",
  },
  {
    id: "inss",
    nome: "INSS",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Direito Previdenciário", peso: 5 },
      { materia: "Português", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 3 },
      { materia: "Direito Constitucional", peso: 2 },
      { materia: "Direito Administrativo", peso: 2 },
      { materia: "Informática", peso: 2 },
      { materia: "Atualidades", peso: 1 },
    ],
    descricao: "Técnico do Seguro Social — carreira administrativa federal.",
  },
  {
    id: "pc-rj",
    nome: "Polícia Civil RJ",
    area: "Concursos Gerais",
    banca: "FGV",
    materias: [
      { materia: "Direito Penal", peso: 4 },
      { materia: "Direito Processual Penal", peso: 3 },
      { materia: "Legislação", peso: 3 },
      { materia: "Português", peso: 3 },
      { materia: "Direito Constitucional", peso: 2 },
      { materia: "Direito Administrativo", peso: 2 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Informática", peso: 1 },
    ],
    descricao: "Delegado, Inspetor e Investigador — polícia judiciária estadual.",
  },
  {
    id: "trt",
    nome: "TRT",
    area: "Concursos Gerais",
    banca: "FCC",
    materias: [
      { materia: "Direito do Trabalho", peso: 5 },
      { materia: "Direito Processual do Trabalho", peso: 4 },
      { materia: "Português", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Informática", peso: 2 },
    ],
    descricao: "Técnico e Analista Judiciário — tribunais regionais do trabalho.",
  },
  {
    id: "petrobras",
    nome: "Petrobras",
    area: "Concursos Gerais",
    banca: "CESGRANRIO",
    materias: [
      { materia: "Português", peso: 3 },
      { materia: "Inglês", peso: 3 },
      { materia: "Matemática", peso: 3 },
      { materia: "Informática", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Legislação", peso: 2 },
      { materia: "Atualidades", peso: 1 },
    ],
    descricao: "Técnico e profissional de nível superior — estatal de energia.",
  },
  {
    id: "controle-externo",
    nome: "TCU / TCE",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Contabilidade", peso: 4 },
      { materia: "Direito Financeiro", peso: 4 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Português", peso: 3 },
      { materia: "Auditoria", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Informática", peso: 2 },
    ],
    descricao: "Auditor de controle externo — fiscalização de recursos públicos.",
  },
  {
    id: "camara-deputados",
    nome: "Câmara dos Deputados",
    area: "Concursos Gerais",
    banca: "a definir",
    materias: [
      { materia: "Português", peso: 3 },
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 3 },
      { materia: "Raciocínio Lógico", peso: 2 },
      { materia: "Informática", peso: 2 },
      { materia: "Legislação", peso: 2 },
      { materia: "Atualidades", peso: 1 },
    ],
    descricao: "Consultor, Analista e Técnico Legislativo — carreira do Legislativo.",
  },

  // ── OAB ───────────────────────────────────────────────────────────
  {
    id: "oab",
    nome: "OAB",
    area: "OAB",
    banca: "FGV",
    materias: [
      { materia: "Direito Constitucional", peso: 3 },
      { materia: "Direito Administrativo", peso: 2 },
      { materia: "Direito Civil", peso: 3 },
      { materia: "Direito Processual Civil", peso: 3 },
      { materia: "Direito Penal", peso: 3 },
      { materia: "Direito Processual Penal", peso: 3 },
      { materia: "Direito do Trabalho", peso: 3 },
      { materia: "Direito Processual do Trabalho", peso: 2 },
      { materia: "Direito Tributário", peso: 2 },
      { materia: "Direito Empresarial", peso: 2 },
      { materia: "Estatuto da Advocacia", peso: 2 },
      { materia: "Direitos Humanos", peso: 1 },
      { materia: "Direito Ambiental", peso: 1 },
      { materia: "Direito do Consumidor", peso: 1 },
      { materia: "Filosofia do Direito", peso: 1 },
      { materia: "Direito Internacional", peso: 1 },
    ],
    descricao: "Exame de Ordem — 1ª fase objetiva e 2ª fase prático-profissional.",
  },

  // ── Militar ───────────────────────────────────────────────────────
  {
    id: "esa",
    nome: "ESA",
    area: "Militar",
    banca: "Exército",
    materias: [
      { materia: "Português", peso: 4 },
      { materia: "Matemática", peso: 4 },
      { materia: "História", peso: 3 },
      { materia: "Geografia", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Conhecimentos Militares", peso: 2 },
    ],
    descricao: "Escola de Sargentos das Armas — nível médio do Exército.",
  },
  {
    id: "espcex",
    nome: "EsPCEx",
    area: "Militar",
    banca: "Exército",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Português", peso: 4 },
      { materia: "Física", peso: 4 },
      { materia: "Química", peso: 3 },
      { materia: "História", peso: 3 },
      { materia: "Geografia", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Redação", peso: 2 },
    ],
    descricao: "Escola Preparatória de Cadetes do Exército — oficial nível médio.",
  },
  {
    id: "eear",
    nome: "EEAR",
    area: "Militar",
    banca: "Aeronáutica",
    materias: [
      { materia: "Português", peso: 4 },
      { materia: "Matemática", peso: 4 },
      { materia: "Física", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Conhecimentos Específicos", peso: 2 },
    ],
    descricao: "Escola de Especialistas de Aeronáutica — sargento nível médio.",
  },
  {
    id: "afa",
    nome: "AFA",
    area: "Militar",
    banca: "Aeronáutica",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Português", peso: 4 },
      { materia: "Física", peso: 4 },
      { materia: "Química", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Redação", peso: 2 },
    ],
    descricao: "Academia da Força Aérea — cadete aviador nível médio.",
  },
  {
    id: "ita",
    nome: "ITA",
    area: "Militar",
    banca: "Aeronáutica",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Física", peso: 5 },
      { materia: "Química", peso: 4 },
      { materia: "Português", peso: 2 },
      { materia: "Inglês", peso: 2 },
    ],
    descricao: "Instituto Tecnológico de Aeronáutica — alto grau de exigência.",
  },
  {
    id: "ime",
    nome: "IME",
    area: "Militar",
    banca: "Exército",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Física", peso: 5 },
      { materia: "Química", peso: 4 },
      { materia: "Português", peso: 2 },
      { materia: "Inglês", peso: 2 },
    ],
    descricao: "Instituto Militar de Engenharia — alto grau de exigência.",
  },
  {
    id: "efomm",
    nome: "EFOMM",
    area: "Militar",
    banca: "Marinha Mercante",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Português", peso: 4 },
      { materia: "Física", peso: 4 },
      { materia: "Química", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Redação", peso: 2 },
    ],
    descricao: "Escola de Formação de Oficiais da Marinha Mercante.",
  },
  {
    id: "escola-naval",
    nome: "Escola Naval",
    area: "Militar",
    banca: "Marinha",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Português", peso: 4 },
      { materia: "Física", peso: 4 },
      { materia: "Química", peso: 3 },
      { materia: "Inglês", peso: 2 },
      { materia: "Redação", peso: 2 },
    ],
    descricao: "Escola Naval — oficial da Marinha nível médio.",
  },

  // ── ENEM ──────────────────────────────────────────────────────────
  {
    id: "enem",
    nome: "ENEM",
    area: "ENEM",
    banca: "INEP",
    materias: [
      { materia: "Matemática", peso: 5 },
      { materia: "Linguagens", peso: 4 },
      { materia: "Ciências da Natureza", peso: 4 },
      { materia: "Ciências Humanas", peso: 4 },
      { materia: "Redação", peso: 3 },
    ],
    descricao: "Exame Nacional do Ensino Médio — 180 questões + redação.",
  },
]

/** Plano genérico para concursos fora da curadoria. */
export const PLANO_PADRAO: PlanoConcurso = {
  id: "padrao",
  nome: "Concurso genérico",
  area: "Concursos Gerais",
  materias: MATERIAS.map((m) => ({ materia: m, peso: 3 })),
  descricao: "Plano genérico para concursos fora da curadoria.",
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Busca um concurso curado pelo nome digitado (aceita parcial). */
export function encontrarConcurso(nome: string): PlanoConcurso | null {
  const alvo = normalizar(nome)
  if (!alvo) return null

  const direto = CONCURSOS.find((c) => normalizar(c.nome) === alvo)
  if (direto) return direto

  const tokens = alvo.split(" ")
  let melhor: PlanoConcurso | null = null
  let maiorCobertura = 0
  for (const c of CONCURSOS) {
    const nomeTokens = new Set(normalizar(c.nome).split(" "))
    const cobertura = tokens.filter((t) => nomeTokens.has(t)).length
    if (cobertura > maiorCobertura) {
      maiorCobertura = cobertura
      melhor = c
    }
  }
  return maiorCobertura > 0 ? melhor : null
}

export function concursosPorArea(area: (typeof AREAS)[number]) {
  return CONCURSOS.filter((c) => c.area === area)
}