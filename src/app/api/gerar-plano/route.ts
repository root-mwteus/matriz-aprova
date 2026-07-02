import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { z } from "zod"

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

const GeraPlanoSchema = z.object({
  concurso: z.string().min(1, "O campo concurso é obrigatório").max(100, "O campo concurso deve ter no máximo 100 caracteres"),
  dataProva: z.string().refine((v) => !isNaN(new Date(v).getTime()) && new Date(v) > new Date(), "O campo dataProva deve ser uma data válida"),
  horasPorDia: z.number().int().min(1).max(16),
})

function gerarPlanoLocal(concurso: string, dataProva: string, horasPorDia: number) {
  const data = new Date(dataProva)
  const hoje = new Date()
  const diasRestantes = Math.ceil((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
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

export async function POST(request: Request) {
  try {
    const parsed = GeraPlanoSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const body = parsed.data

    const plan = gerarPlanoLocal(body.concurso, body.dataProva, body.horasPorDia)

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }) },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const janela24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from("study_plans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", janela24h)

    if (count !== null && count >= 5) {
      return NextResponse.json({ error: "Limite diário atingido. Você pode gerar até 5 planos por dia." }, { status: 429 })
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
