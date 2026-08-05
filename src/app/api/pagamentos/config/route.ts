import { NextResponse } from "next/server"
import { getConfigPagamentos } from "@/lib/pagamentos-config"
import { isTestMode } from "@/lib/mercadopago"

/**
 * GET /api/pagamentos/config
 *
 * Configuração pública do plano, editável pelo admin. A página /assinar
 * e o banner de bloqueio do plano demo leem daqui em vez de valores
 * fixos em código. Não expõe segredos — só dados de exibição.
 */

export async function GET() {
  const config = await getConfigPagamentos()

  return NextResponse.json({
    tituloPlano: config.titulo_plano,
    descricaoPlano: config.descricao_plano,
    valorCentavos: config.valor_centavos,
    beneficios: config.beneficios,
    avisoBloqueio: config.aviso_bloqueio,
    pagamentosAtivos: config.pagamentos_ativos,
    modoTeste: isTestMode(),
  })
}
