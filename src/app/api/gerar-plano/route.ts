import { NextResponse } from "next/server"
import { z } from "zod"
import { encontrarConcurso, PLANO_PADRAO } from "@/lib/gerar-plano/planos-concursos"
import { gerarPlanoConcurso } from "@/lib/gerar-plano/gerar-plano"
import { refinarFocosComIA } from "@/lib/gerar-plano/prompt"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/supabase/auth"

const GerarPlanoSchema = z.object({
  concurso: z
    .string()
    .min(1, "O campo concurso é obrigatório")
    .max(100, "O campo concurso deve ter no máximo 100 caracteres"),
  dataProva: z.string().refine(
    (v) => !isNaN(new Date(v).getTime()) && new Date(v) > new Date(),
    "O campo dataProva deve ser uma data válida"
  ),
  horasPorDia: z.number().int().min(1).max(16),
})

export async function POST(request: Request) {
  try {
    const parsed = GerarPlanoSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const body = parsed.data

    // Autenticação e rate-limit ANTES da IA: a geração custa crédito e
    // não pode ser feita por quem não está logado.
    const user = await requireUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createClient()

    const janela24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from("planos_estudo")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", janela24h)

    if (count !== null && count >= 5) {
      return NextResponse.json(
        { error: "Limite diário atingido. Você pode gerar até 5 planos por dia." },
        { status: 429 }
      )
    }

    // Curadoria por nome; quem não está na lista cai no plano genérico.
    const concurso = encontrarConcurso(body.concurso) ?? PLANO_PADRAO
    const plano = gerarPlanoConcurso({
      concurso,
      dataProva: body.dataProva,
      horasPorDia: body.horasPorDia,
    })

    // Refino opcional dos focos semanais por IA — falha silenciosa
    // (o plano determinístico já existe, a IA só melhora os rótulos).
    const focos = await refinarFocosComIA(concurso, plano.semanas)
    if (focos) {
      plano.semanas = plano.semanas.map((semana, i) => ({
        ...semana,
        foco: focos[i] ?? semana.foco,
      }))
    }

    const { data: planoSalvo, error: planoError } = await supabase
      .from("planos_estudo")
      .insert({
        user_id: user.id,
        concurso: plano.concurso,
        area_concurso: plano.areaConcurso,
        data_prova: body.dataProva,
        horas_por_dia: body.horasPorDia,
        semanas_total: plano.semanasTotal,
      })
      .select("id")
      .single()

    if (planoError || !planoSalvo) {
      console.error("Erro ao salvar plano de estudos:", planoError)
      return NextResponse.json({ error: "Erro ao salvar plano de estudos" }, { status: 500 })
    }

    const { error: semanasError } = await supabase.from("plano_semanas").insert(
      plano.semanas.map((s) => ({
        plano_id: planoSalvo.id,
        numero: s.numero,
        semana_inicio: s.semanaInicio,
        foco: s.foco,
        tarefas: s.dias,
      }))
    )

    if (semanasError) {
      console.error("Erro ao salvar semanas do plano:", semanasError)
      return NextResponse.json({ error: "Erro ao salvar o plano" }, { status: 500 })
    }

    return NextResponse.json({
      ...plano,
      planoId: planoSalvo.id,
    })
  } catch (err) {
    console.error("Erro ao gerar plano:", err)
    return NextResponse.json({ error: "Erro ao gerar plano" }, { status: 500 })
  }
}