import type { PlanoConcurso } from "@/lib/gerar-plano/planos-concursos"

/**
 * Gerador de plano de estudos por semanas.
 *
 * Em vez de uma única semana de 7 dias, o plano cobre TODAS as semanas até
 * a prova (definida pela data escolhida no onboarding) e o usuário libera
 * as semanas progressivamente: só a semana liberada é editável, as demais
 * ficam com cadeado até a anterior ser concluída (ou a data passar).
 *
 * As matérias entram com peso (curadoria por concurso) e são distribuídas
 * em três fases ao longo do tempo: Fundamentos → Aprofundamento → Revisão
 * e Simulados. A distribuição é determinística — mesmo concurso, data e
 * carga geram o mesmo plano, o que torna os testes estáveis e a regeneração
 * previsível.
 */

export const DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const

export const MAX_SEMANAS = 52
export const MIN_SEMANAS = 1

export interface Tarefa {
  materia: string
  descricao: string
  horas: number
  concluido: boolean
  ordem: number
}

export interface DiaPlano {
  dia: string
  tarefas: Tarefa[]
  totalHoras: number
}

export interface SemanaPlano {
  numero: number
  /** Data de início real (segunda-feira) da semana. */
  semanaInicio: string
  foco: string
  concluido: boolean
  dias: DiaPlano[]
}

export interface PlanoGerado {
  concurso: string
  areaConcurso: string
  dataProva: string
  horasPorDia: number
  semanasTotal: number
  semanas: SemanaPlano[]
  geradoEm: string
}

type Fase = { nome: string; verbo: string }

const FASES: Fase[] = [
  { nome: "Fundamentos", verbo: "Teoria e leitura de edital" },
  { nome: "Aprofundamento", verbo: "Questões e aprofundamento" },
  { nome: "Revisão e Simulados", verbo: "Revisão espaçada e simulado" },
]

/** Número de semanas até a prova, limitado a 1..52. */
export function calcularSemanas(dataProva: string): number {
  const prova = new Date(dataProva + "T00:00:00")
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dias = Math.max(1, Math.ceil((prova.getTime() - hoje.getTime()) / 86_400_000))
  return Math.min(MAX_SEMANAS, Math.max(MIN_SEMANAS, Math.ceil(dias / 7)))
}

/** Segunda-feira da semana corrente (base para a semana 1). */
export function segundaDaSemana(): string {
  const d = new Date()
  const dia = d.getDay() === 0 ? 6 : d.getDay() - 1
  d.setDate(d.getDate() - dia)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split("T")[0]
}

export function dataDaSemana(numero: number): string {
  const base = new Date(segundaDaSemana() + "T00:00:00")
  base.setDate(base.getDate() + (numero - 1) * 7)
  return base.toISOString().split("T")[0]
}

function faseDaSemana(semanaIdx: number, semanasTotal: number): Fase {
  const fracao = semanaIdx / semanasTotal
  if (fracao < 0.4) return FASES[0]
  if (fracao < 0.7) return FASES[1]
  return FASES[2]
}

/** Lista ponderada: cada matéria repete `peso` vezes (peso 5 → 5 entradas). */
function montarPool(materias: { materia: string; peso: number }[]): string[] {
  const pool: string[] = []
  for (const { materia, peso } of materias) {
    for (let i = 0; i < peso; i++) pool.push(materia)
  }
  return pool
}

function distribuirHoras(total: number, qtd: number): number[] {
  if (qtd <= 0) return []
  const base = Math.floor(total / qtd)
  const resto = total - base * qtd
  return Array.from({ length: qtd }, (_, i) => base + (i < resto ? 1 : 0))
}

function montarDia(
  dia: string,
  materias: string[],
  horasPorDia: number,
  verbo: string,
  forcarRevisao = false
): DiaPlano {
  // Domingo: carga máxima de 3h, tarefa leve. Sexta: revisão + questões.
  const ehDomingo = dia === "Domingo"
  const totalHoras = ehDomingo ? Math.min(horasPorDia, 3) : horasPorDia

  if (forcarRevisao) {
    const horas = distribuirHoras(totalHoras, 2)
    return {
      dia,
      tarefas: [
        { materia: "Revisão", descricao: "Revisão semanal do que foi estudado", horas: horas[0], concluido: false, ordem: 0 },
        { materia: "Questões", descricao: "Resolução de questões da semana", horas: horas[1], concluido: false, ordem: 1 },
      ],
      totalHoras,
    }
  }

  if (ehDomingo) {
    const horas = distribuirHoras(totalHoras, 1)
    return {
      dia,
      tarefas: [
        { materia: materias[0], descricao: `Revisão leve de ${materias[0]}`, horas: horas[0], concluido: false, ordem: 0 },
      ],
      totalHoras,
    }
  }

  const qtd = horasPorDia >= 6 ? 3 : 2
  const horas = distribuirHoras(totalHoras, qtd)
  const rotacionadas = [materias[0], materias[1], materias[2 % materias.length]]

  return {
    dia,
    tarefas: rotacionadas.slice(0, qtd).map((m, i) => ({
      materia: m,
      descricao: `${m} — ${verbo}`,
      horas: horas[i],
      concluido: false,
      ordem: i,
    })),
    totalHoras,
  }
}

export interface ParametrosGeracao {
  concurso: PlanoConcurso
  dataProva: string
  horasPorDia: number
}

/** Gera as semanas completas até a prova, a partir da curadoria. */
export function gerarPlanoConcurso({ concurso, dataProva, horasPorDia }: ParametrosGeracao): PlanoGerado {
  const semanasTotal = calcularSemanas(dataProva)
  const pool = montarPool(concurso.materias)

  const semanas: SemanaPlano[] = Array.from({ length: semanasTotal }, (_, s) => {
    const fase = faseDaSemana(s, semanasTotal)
    const foco = pool[s % pool.length]

    // Cada dia puxa um bloco rotacionado do pool ponderado; a rotação
    // começa deslocada a cada semana para as matérias se alternarem.
    const dias = DIAS.map((dia, d) => {
      const offset = (s * 7 + d * 2) % pool.length
      const materias = [
        pool[offset],
        pool[(offset + 1) % pool.length],
        pool[(offset + 2) % pool.length],
      ]
      return montarDia(dia, materias, horasPorDia, fase.verbo, dia === "Sexta")
    })

    return {
      numero: s + 1,
      semanaInicio: dataDaSemana(s + 1),
      foco: `${fase.nome} — foco em ${foco}`,
      concluido: false,
      dias,
    }
  })

  return {
    concurso: concurso.nome,
    areaConcurso: concurso.area,
    dataProva,
    horasPorDia,
    semanasTotal,
    semanas,
    geradoEm: new Date().toISOString(),
  }
}