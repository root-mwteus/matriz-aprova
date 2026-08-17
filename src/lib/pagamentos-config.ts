import { createServiceClient } from "@/lib/supabase/service"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Configuração de pagamentos editável pelo admin.
 *
 * Antes o preço, o título e os benefícios do plano viviam fixos em
 * `mercadopago.ts`. Agora moram na tabela `config_pagamentos` (linha
 * única, id = 1), que o painel admin edita. Tudo que depende do valor
 * passa por este módulo — checkout, webhook, página /assinar e o aviso
 * de bloqueio do plano demo.
 *
 * Os padrões abaixo valem quando a tabela ainda não foi criada/seeded
 * no banco (ex.: ambiente de dev sem a migration aplicada).
 */

export interface ConfigPagamentos {
  titulo_plano: string
  descricao_plano: string
  /** Preço em centavos (inteiro), como a tabela `pagamentos.valor`. */
  valor_centavos: number
  beneficios: string[]
  aviso_bloqueio: string
  pagamentos_ativos: boolean
  /** % de desconto para quem criou a conta com código de indicação. */
  desconto_indicacao_pct: number
}

export const CONFIG_PAGAMENTOS_DEFAULT: ConfigPagamentos = {
  titulo_plano: "Plano Vitalício Matriz Aprova",
  descricao_plano: "Um pagamento. Acesso completo para sempre.",
  valor_centavos: 4999,
  beneficios: [
    "Acesso às 4 áreas (Concursos, OAB, Militar, ENEM)",
    "Banco de questões comentadas sem limite",
    "Materiais em PDF completos",
    "IA Preditiva da sua banca",
    "Simulados com ranking nacional",
    "Plano de estudos personalizado",
  ],
  aviso_bloqueio:
    "Você está no plano demo. Assine o plano vitalício para desbloquear o acesso completo à plataforma.",
  pagamentos_ativos: true,
  desconto_indicacao_pct: 10,
}

export function formatarValor(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100)
}

/** "R$ 49,99" -> 4999. Aceita vírgula ou ponto como separador decimal. */
export function parseValorParaCentavos(texto: string): number | null {
  const normalizado = texto.replace(/\./g, "").replace(",", ".")
  const valor = Number(normalizado)
  if (!Number.isFinite(valor) || valor <= 0) return null
  return Math.round(valor * 100)
}

export function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",")
}

/**
 * Lê a configuração do banco com o cliente service (ignora RLS).
 * Se a linha ainda não existir, retorna os padrões.
 */
export async function getConfigPagamentos(
  supabase?: SupabaseClient
): Promise<ConfigPagamentos> {
  const client = supabase ?? createServiceClient()

  const { data } = await client.from("config_pagamentos").select("*").eq("id", 1).single()

  if (!data) return CONFIG_PAGAMENTOS_DEFAULT

  return {
    titulo_plano: data.titulo_plano ?? CONFIG_PAGAMENTOS_DEFAULT.titulo_plano,
    descricao_plano: data.descricao_plano ?? CONFIG_PAGAMENTOS_DEFAULT.descricao_plano,
    valor_centavos: Number(data.valor_centavos) || CONFIG_PAGAMENTOS_DEFAULT.valor_centavos,
    beneficios: Array.isArray(data.beneficios) ? data.beneficios : CONFIG_PAGAMENTOS_DEFAULT.beneficios,
    aviso_bloqueio: data.aviso_bloqueio ?? CONFIG_PAGAMENTOS_DEFAULT.aviso_bloqueio,
    pagamentos_ativos: data.pagamentos_ativos !== false,
    desconto_indicacao_pct:
      Number(data.desconto_indicacao_pct) || CONFIG_PAGAMENTOS_DEFAULT.desconto_indicacao_pct,
  }
}
