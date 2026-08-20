import { describe, expect, it } from "vitest"
import {
  calcularSemanas,
  dataDaSemana,
  segundaDaSemana,
  MAX_SEMANAS,
  MIN_SEMANAS,
} from "@/lib/gerar-plano/gerar-plano"
import { gerarPlanoConcurso } from "@/lib/gerar-plano/gerar-plano"
import {
  CONCURSOS,
  PLANO_PADRAO,
  concursosPorArea,
  encontrarConcurso,
} from "@/lib/gerar-plano/planos-concursos"

const DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
]

function dataFutura(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  // toISOString() converte para UTC e, no fim do dia, cai no dia seguinte —
  // o app trabalha com datas locais, então normaliza antes de formatar.
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().split("T")[0]
}

describe("calcularSemanas", () => {
  it("menos de uma semana vira pelo menos 1 semana", () => {
    expect(calcularSemanas(dataFutura(1))).toBe(1)
  })

  it("7 dias exatos viram 1 semana", () => {
    expect(calcularSemanas(dataFutura(7))).toBe(1)
  })

  it("14 dias viram 2 semanas", () => {
    expect(calcularSemanas(dataFutura(14))).toBe(2)
  })

  it("arredonda para cima (8 dias = 2 semanas)", () => {
    expect(calcularSemanas(dataFutura(8))).toBe(2)
  })

  it("respeita o teto de 52 semanas", () => {
    expect(calcularSemanas(dataFutura(400))).toBe(MAX_SEMANAS)
  })

  it("respeita o piso de 1 semana", () => {
    expect(calcularSemanas(dataFutura(0))).toBe(MIN_SEMANAS)
  })
})

describe("segundaDaSemana / dataDaSemana", () => {
  it("a semana 1 começa na segunda-feira da semana corrente", () => {
    const segunda = new Date(segundaDaSemana() + "T00:00:00")
    expect(segunda.getDay()).toBe(1)
  })

  it("cada semana começa 7 dias depois da anterior", () => {
    const s1 = new Date(dataDaSemana(1) + "T00:00:00").getTime()
    const s2 = new Date(dataDaSemana(2) + "T00:00:00").getTime()
    expect(s2 - s1).toBe(7 * 86_400_000)
  })
})

describe("gerarPlanoConcurso", () => {
  const receita = encontrarConcurso("Receita Federal")!

  it("gera 7 dias em cada semana, com todas as horas do dia", () => {
    const plano = gerarPlanoConcurso({ concurso: receita, dataProva: dataFutura(28), horasPorDia: 4 })
    expect(plano.semanasTotal).toBe(4)
    for (const semana of plano.semanas) {
      expect(semana.dias).toHaveLength(7)
      expect(semana.dias.map((d) => d.dia)).toEqual(DIAS)
      for (const dia of semana.dias) {
        const soma = dia.tarefas.reduce((acc, t) => acc + t.horas, 0)
        expect(soma).toBe(dia.totalHoras)
      }
    }
  })

  it("domingo nunca passa de 3 horas", () => {
    const plano = gerarPlanoConcurso({ concurso: receita, dataProva: dataFutura(21), horasPorDia: 8 })
    const domingo = plano.semanas[0].dias.find((d) => d.dia === "Domingo")!
    expect(domingo.totalHoras).toBeLessThanOrEqual(3)
  })

  it("sexta sempre traz revisão e questões", () => {
    const plano = gerarPlanoConcurso({ concurso: receita, dataProva: dataFutura(14), horasPorDia: 4 })
    for (const semana of plano.semanas) {
      const sexta = semana.dias.find((d) => d.dia === "Sexta")!
      const materias = sexta.tarefas.map((t) => t.materia)
      expect(materias).toContain("Revisão")
      expect(materias).toContain("Questões")
    }
  })

  it("só usa matérias da curadoria do concurso", () => {
    const plano = gerarPlanoConcurso({ concurso: receita, dataProva: dataFutura(28), horasPorDia: 4 })
    const permitidas = new Set(receita.materias.map((m) => m.materia))
    for (const semana of plano.semanas) {
      for (const dia of semana.dias) {
        for (const t of dia.tarefas) {
          if (t.materia === "Revisão" || t.materia === "Questões") continue
          expect(permitidas.has(t.materia)).toBe(true)
        }
      }
    }
  })

  it("é determinístico: mesmo input gera o mesmo plano", () => {
    const args = { concurso: receita, dataProva: dataFutura(21), horasPorDia: 5 }
    const a = gerarPlanoConcurso(args)
    const b = gerarPlanoConcurso(args)
    // geradoEm é o instante da geração (varia por 1ms entre chamadas).
    const { geradoEm: _a, ...corpoA } = a
    const { geradoEm: _b, ...corpoB } = b
    expect(corpoA).toEqual(corpoB)
  })

  it("muda de fase ao longo das semanas (foco diferente no começo e no fim)", () => {
    const plano = gerarPlanoConcurso({ concurso: receita, dataProva: dataFutura(70), horasPorDia: 4 })
    const primeira = plano.semanas[0].foco
    const ultima = plano.semanas[plano.semanasTotal - 1].foco
    expect(primeira).not.toBe(ultima)
  })

  it("funciona com o plano padrão para concurso desconhecido", () => {
    const plano = gerarPlanoConcurso({
      concurso: PLANO_PADRAO,
      dataProva: dataFutura(14),
      horasPorDia: 4,
    })
    expect(plano.semanas).toHaveLength(2)
    expect(plano.areaConcurso).toBe("Concursos Gerais")
  })
})

describe("encontrarConcurso", () => {
  it("acha por nome exato sem acento", () => {
    expect(encontrarConcurso("Receita Federal")?.id).toBe("receita-federal")
  })

  it("acha por nome com acento", () => {
    expect(encontrarConcurso("Polícia Federal")?.id).toBe("policia-federal")
  })

  it("acha por parte do nome", () => {
    expect(encontrarConcurso("PRF")?.id).toBe("prf")
  })

  it("não encontra nada para texto vazio", () => {
    expect(encontrarConcurso("")).toBeNull()
  })

  it("não encontra nada para texto sem correspondência", () => {
    expect(encontrarConcurso("Concurso de zumba")).toBeNull()
  })
})

describe("concursosPorArea", () => {
  it("cada área tem pelo menos um concurso curado", () => {
    for (const area of ["Concursos Gerais", "OAB", "Militar", "ENEM"] as const) {
      expect(concursosPorArea(area).length).toBeGreaterThan(0)
    }
  })

  it("a curadoria tem mais de 10 concursos", () => {
    expect(CONCURSOS.length).toBeGreaterThan(10)
  })

  it("todos os concursos da curadoria têm peso positivo", () => {
    for (const c of CONCURSOS) {
      for (const m of c.materias) {
        expect(m.peso).toBeGreaterThan(0)
      }
    }
  })
})