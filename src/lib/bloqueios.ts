/**
 * Bloqueio temporário de seções do painel.
 *
 * A lista é a fonte canônica usada pelo seed da migração 021 e pelo
 * painel admin — as seções são as rotas de estudo da sidebar
 * (navigation.ts), sem o /dashboard (bloquear o painel deixaria o
 * usuário sem tela para onde voltar) e sem /onboarding e /assinar.
 */
export const SECOES_PAINEL = [
  { secao: "/questoes", label: "Questões" },
  { secao: "/simulados", label: "Simulados" },
  { secao: "/cronometro", label: "Cronômetro" },
  { secao: "/materiais", label: "Materiais" },
  { secao: "/plano", label: "Plano de estudos" },
  { secao: "/editais", label: "Editais" },
  { secao: "/estatisticas", label: "Estatísticas" },
  { secao: "/comunidade", label: "Comunidade" },
] as const

export interface BloqueioSecao {
  secao: string
  bloqueado: boolean
  mensagem: string
}

/**
 * A qual seção uma rota pertence — o prefixo mais longo vence, no
 * espírito do isRouteActive: /comunidade/ligas pertence a
 * /comunidade, /questoes/historico a /questoes. Rota fora de
 * qualquer seção (ex.: /dashboard) não pertence a nenhuma.
 */
export function secaoDaRota(pathname: string, secoes: readonly string[]): string | null {
  let melhor: string | null = null
  for (const secao of secoes) {
    if (pathname === secao || pathname.startsWith(secao + "/")) {
      if (!melhor || secao.length > melhor.length) melhor = secao
    }
  }
  return melhor
}
