import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/supabase/auth"

const DesbloquearSchema = z.object({
  planoId: z.string().uuid("O campo planoId deve ser um UUID válido"),
})

/**
 * Libera a próxima semana do plano.
 *
 * A liberação é progressiva: a semana seguinte abre quando a atual está
 * 100% concluída OU quando a data da semana já passou — ninguém fica
 * preso por ter perdido o ritmo. A verificação é feita no servidor, então
 * o cadeado não depende do que o cliente acha que concluiu.
 */
export async function POST(request: Request) {
  try {
    const parsed = DesbloquearSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const user = await requireUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const supabase = createClient()

    const { data: plano, error: planoError } = await supabase
      .from("planos_estudo")
      .select("id, user_id, semana_liberada, semanas_total")
      .eq("id", parsed.data.planoId)
      .single()

    if (planoError || !plano || plano.user_id !== user.id) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    if (plano.semana_liberada >= plano.semanas_total) {
      return NextResponse.json({ liberada: plano.semana_liberada, fim: true })
    }

    const { data: semana, error: semanaError } = await supabase
      .from("plano_semanas")
      .select("numero, semana_inicio, tarefas, concluido")
      .eq("plano_id", plano.id)
      .eq("numero", plano.semana_liberada)
      .single()

    if (semanaError || !semana) {
      return NextResponse.json({ error: "Semana não encontrada" }, { status: 404 })
    }

    const tarefas = (semana.tarefas ?? []) as { concluido?: boolean }[]
    const todasConcluidas = tarefas.length > 0 && tarefas.every((t) => t.concluido)

    const fimDaSemana = new Date(`${semana.semana_inicio}T00:00:00`)
    fimDaSemana.setDate(fimDaSemana.getDate() + 7)
    const semanaPassou = new Date() >= fimDaSemana

    if (!todasConcluidas && !semanaPassou) {
      return NextResponse.json({ liberada: plano.semana_liberada, fim: false })
    }

    const proxima = Math.min(plano.semana_liberada + 1, plano.semanas_total)

    const { error: updateSemana } = await supabase
      .from("plano_semanas")
      .update({ concluido: true })
      .eq("plano_id", plano.id)
      .eq("numero", semana.numero)

    const { error: updatePlano } = await supabase
      .from("planos_estudo")
      .update({ semana_liberada: proxima })
      .eq("id", plano.id)

    if (updateSemana || updatePlano) {
      console.error("Erro ao liberar semana:", updateSemana ?? updatePlano)
      return NextResponse.json({ error: "Erro ao liberar a semana" }, { status: 500 })
    }

    return NextResponse.json({ liberada: proxima, fim: proxima >= plano.semanas_total })
  } catch (err) {
    console.error("Erro ao liberar semana:", err)
    return NextResponse.json({ error: "Erro ao liberar a semana" }, { status: 500 })
  }
}