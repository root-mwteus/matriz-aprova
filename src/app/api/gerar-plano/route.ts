import { NextResponse } from "next/server"
import { z } from "zod"
import OpenAI from "openai"
import { MATERIAS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/supabase/auth"

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] as const

const GeraPlanoSchema = z.object({
  concurso: z.string().min(1, "O campo concurso é obrigatório").max(100, "O campo concurso deve ter no máximo 100 caracteres"),
  dataProva: z.string().refine((v) => !isNaN(new Date(v).getTime()) && new Date(v) > new Date(), "O campo dataProva deve ser uma data válida"),
  horasPorDia: z.number().int().min(1).max(16),
})

function diasRestantesPara(dataProva: string): number {
  const data = new Date(dataProva)
  const hoje = new Date()
  return Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

function gerarPlanoLocal(concurso: string, dataProva: string, horasPorDia: number) {
  const diasRestantes = diasRestantesPara(dataProva)
  const semanasRestantes = Math.max(1, Math.ceil(diasRestantes / 7))

  const tarefasBase: Record<string, string[]> = {
    "Segunda": ["Português - Revisão de gramática", "Direito Constitucional - Princípios fundamentais"],
    "Terça": ["Matemática - Raciocínio lógico", "Informática - Pacote Office"],
    "Quarta": ["Direito Administrativo - Servidores públicos", "Português - Interpretação de texto"],
    "Quinta": ["Conhecimentos específicos", "Atualidades - Economia e política"],
    "Sexta": ["Revisão semanal - Questões da semana", "Simulado parcial"],
    "Sábado": ["Direito Constitucional - Jurisprudência", "Matemática - Probabilidade"],
    "Domingo": ["Descanso ativo - Revisão leve", "Leitura de materiais"],
  }

  const tarefas = DIAS.map((dia) => {
    const base = tarefasBase[dia] || ["Estudo livre"]
    const horas = dia === "Domingo" ? Math.min(horasPorDia, 3) : horasPorDia
    return {
      dia,
      tarefas: base.map((t, i) => ({
        materia: t.split(" - ")[0],
        descricao: t,
        horas: Math.round(horas / base.length),
        concluido: false,
        ordem: i,
      })),
      totalHoras: horas,
    }
  })

  return {
    concurso,
    dataProva,
    horasPorDia,
    semanasRestantes,
    diasRestantes,
    dias: tarefas,
    geradoEm: new Date().toISOString(),
  }
}

const PlanoIARawSchema = z.object({
  dias: z
    .array(
      z.object({
        tarefas: z
          .array(
            z.object({
              materia: z.string().min(1),
              descricao: z.string().min(1),
              horas: z.number().min(0).max(16),
              ordem: z.number().int().min(0),
            })
          )
          .min(1)
          .max(6),
        totalHoras: z.number().min(0).max(16),
      })
    )
    .length(7),
})

function montarPlano(params: z.infer<typeof GeraPlanoSchema>, dias: z.infer<typeof PlanoIARawSchema>["dias"]) {
  const diasRestantes = diasRestantesPara(params.dataProva)
  return {
    concurso: params.concurso,
    dataProva: params.dataProva,
    horasPorDia: params.horasPorDia,
    semanasRestantes: Math.max(1, Math.ceil(diasRestantes / 7)),
    diasRestantes,
    dias: DIAS.map((dia, i) => ({
      dia,
      tarefas: dias[i].tarefas.map((t, j) => ({ ...t, ordem: j, concluido: false })),
      totalHoras: dias[i].totalHoras,
    })),
    geradoEm: new Date().toISOString(),
  }
}

async function gerarComIA(params: z.infer<typeof GeraPlanoSchema>) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const restantes = diasRestantesPara(params.dataProva)
  const materias = MATERIAS.join(", ")

  const prompt = `Monte um cronograma semanal de estudos para ${params.concurso}, com a prova em ${params.dataProva} (faltam ${restantes} dias) e ${params.horasPorDia} horas disponíveis por dia.

Regras:
- Use apenas matérias desta lista: ${materias}.
- Dias de semana: 2 a 4 tarefas. Domingo: no máximo 3 horas no total.
- Inclua revisão e resolução de questões na sexta-feira.
- Descrições específicas e realistas (ex.: "Direito Constitucional - Princípios fundamentais").
- A soma das horas das tarefas de cada dia deve ser igual a totalHoras.
- Responda APENAS JSON neste formato exato:
{"dias":[{"tarefas":[{"materia":"...","descricao":"...","horas":2,"ordem":0}],"totalHoras":4}]}
- Exatamente 7 objetos em "dias", na ordem: Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo.`

  const openai = new OpenAI({ apiKey, timeout: 8000 })
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um especialista em preparação para concursos públicos e retorna apenas JSON válido." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) return null

  const parsed = PlanoIARawSchema.safeParse(JSON.parse(content))
  if (!parsed.success) return null

  return montarPlano(params, parsed.data.dias)
}

export async function POST(request: Request) {
  try {
    const parsed = GeraPlanoSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const body = parsed.data

    // Autenticação e rate-limit ANTES da IA: chamada à OpenAI custa
    // crédito e não pode ser feita por quem não está logado.
    const user = await requireUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createClient()

    const janela24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from("study_plans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", janela24h)

    if (count !== null && count >= 5) {
      return NextResponse.json({ error: "Limite diário atingido. Você pode gerar até 5 planos por dia." }, { status: 429 })
    }

    // IA primeiro, com o gerador local como plano B — a geração não pode
    // quebrar por timeout, cota ou indisponibilidade da OpenAI.
    let plan: ReturnType<typeof gerarPlanoLocal> | null = null
    try {
      plan = await gerarComIA(body)
    } catch (err) {
      console.error("Erro na geração por IA, usando fallback local:", err)
    }
    if (!plan) {
      plan = gerarPlanoLocal(body.concurso, body.dataProva, body.horasPorDia)
    }

    const { error: insertError } = await supabase.from("study_plans").insert({
      user_id: user.id,
      semana_inicio: new Date().toISOString().split("T")[0],
      tarefas: plan.dias,
    })

    if (insertError) {
      console.error("Erro ao salvar plano de estudos:", insertError)
      return NextResponse.json({ error: "Erro ao salvar plano de estudos" }, { status: 500 })
    }

    return NextResponse.json(plan)
  } catch (err) {
    console.error("Erro ao gerar plano:", err)
    return NextResponse.json({ error: "Erro ao gerar plano" }, { status: 500 })
  }
}
