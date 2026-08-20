import { NextResponse } from "next/server"
import { requireUser } from "@/lib/supabase/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { criarLink } from "@/lib/infinitepay"
import { getConfigPagamentos } from "@/lib/pagamentos-config"

/**
 * POST /api/pagamentos/checkout
 *
 * Autentica o usuário, cria um link de Checkout Integrado na InfinitePay
 * e grava um pagamento pendente. Retorna a `url` para o front
 * redirecionar. Idempotente por usuário: quem já é vitalício não pode
 * abrir um checkout novo. Título e preço vêm da config editável no
 * painel admin.
 */

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const service = createServiceClient()

  const config = await getConfigPagamentos(service)

  if (!config.pagamentos_ativos) {
    return NextResponse.json(
      { error: "Os pagamentos estão temporariamente desativados. Tente novamente mais tarde." },
      { status: 503 }
    )
  }

  const { data: perfil } = await service
    .from("profiles")
    .select("email, plano")
    .eq("id", user.id)
    .single()

  if (perfil?.plano === "vitalicio") {
    return NextResponse.json({ error: "Você já tem acesso vitalício", jaAtivo: true }, { status: 400 })
  }

  // Indicação: quem criou conta com código de alguém tem UMA indicação
  // pendente — o desconto sai do preço cheio aqui, e o valor gravado na
  // linha de `pagamentos` é o que o webhook valida. Sem isso, o webhook
  // compararia contra o preço cheio e rejeitaria o pagamento com
  // desconto (pago e não promovido).
  const { data: indicacao } = await service
    .from("indicacoes")
    .select("id")
    .eq("indicado_id", user.id)
    .eq("status", "pendente")
    .maybeSingle()

  const pct = indicacao ? Math.min(Math.max(config.desconto_indicacao_pct, 0), 90) : 0
  const valorFinal = pct > 0 ? Math.round((config.valor_centavos * (100 - pct)) / 100) : config.valor_centavos

  // order_nsu identifica o pedido no nosso sistema e no checkout da
  // InfinitePay — o webhook chega com ele e é assim que confirmamos que
  // a notificação é de uma compra real (UUID aleatório, só o servidor vê).
  const orderNsu = crypto.randomUUID()

  let url: string
  try {
    const link = await criarLink({
      email: perfil?.email ?? user.email ?? "",
      orderNsu,
      titulo: config.titulo_plano,
      valorCentavos: valorFinal,
    })
    url = link.url
  } catch (e) {
    console.error("checkout: falha ao criar link", e)
    return NextResponse.json({ error: "Falha ao iniciar o pagamento. Tente novamente." }, { status: 502 })
  }

  const { error } = await service.from("pagamentos").insert({
    user_id: user.id,
    order_nsu: orderNsu,
    status: "pending",
    valor: valorFinal,
  })

  if (error) {
    console.error("checkout: erro ao registrar pagamento", error)
    return NextResponse.json({ error: "Falha ao registrar o pagamento" }, { status: 500 })
  }

  return NextResponse.json({ url })
}
