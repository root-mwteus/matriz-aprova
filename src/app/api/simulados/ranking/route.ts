import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export const dynamic = "force-dynamic"

/**
 * Ranking nacional de simulados.
 *
 * Lido direto pelo cliente, o RLS de `simulations` só mostra as linhas
 * do próprio usuário — o ranking ficaria com uma única posição. Esta
 * rota autentica o usuário e usa service_role no servidor para ler os
 * resultados de todos.
 */

interface SimulacaoRow {
  user_id: string
  pontuacao: number
  questoes: string[] | null
  tempo_total: number
  created_at: string
}

interface MelhorResultado {
  user_id: string
  nome: string
  pontuacao: number
  total: number
  tempo_total: number
  pct: number
  created_at: string
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const service = createServiceClient()

  const { data: simulations } = await service
    .from("simulations")
    .select("user_id, pontuacao, questoes, tempo_total, created_at")
    .not("pontuacao", "eq", -1)
    .order("created_at", { ascending: false })
    .limit(200)

  if (!simulations?.length) {
    return NextResponse.json({ ranking: [], userId: user.id })
  }

  // Melhor resultado de cada pessoa, sem tocar no banco por linha.
  const melhores = new Map<string, Omit<MelhorResultado, "nome">>()
  for (const s of simulations as SimulacaoRow[]) {
    const total = s.questoes?.length || 0
    const pct = total > 0 ? Math.round((s.pontuacao / total) * 100) : 0
    const atual = melhores.get(s.user_id)
    if (!atual || atual.pct < pct) {
      melhores.set(s.user_id, {
        user_id: s.user_id,
        pontuacao: s.pontuacao,
        total,
        tempo_total: s.tempo_total,
        pct,
        created_at: s.created_at,
      })
    }
  }

  // Uma consulta para todos os nomes, em vez de uma por linha.
  const ids = Array.from(melhores.keys())
  const { data: perfis } = await service.from("profiles").select("id, nome").in("id", ids)

  const nomes = new Map(perfis?.map((p) => [p.id, p.nome as string]) ?? [])

  const ranking: MelhorResultado[] = Array.from(melhores.values())
    .map((e) => ({ ...e, nome: nomes.get(e.user_id) || "Anônimo" }))
    // Empate em percentual é desempatado pelo tempo — quem fez o mesmo
    // em menos tempo fica na frente.
    .sort((a, b) => b.pct - a.pct || a.tempo_total - b.tempo_total)
    .slice(0, 50)

  return NextResponse.json({ ranking, userId: user.id })
}
