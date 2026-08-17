/**
 * Rotas por nível de acesso.
 *
 * Fonte única para o middleware (quem pode entrar) e para o robots.txt
 * (o que os buscadores podem indexar). As duas listas viviam separadas e
 * já estavam divergindo: /comunidade e /cronometro não eram protegidas
 * pelo middleware nem bloqueadas para indexação.
 *
 * Página nova dentro de (dashboard): acrescente aqui e os dois lugares
 * passam a saber dela.
 */

/** Exigem sessão. */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/questoes",
  "/simulados",
  "/materiais",
  "/editais",
  "/plano",
  "/estatisticas",
  "/comunidade",
  "/cronometro",
  "/onboarding",
  "/assinar",
  "/seguranca",
  "/perfil",
] as const

/** Telas de entrada — quem já tem sessão é mandado para o painel. */
export const AUTH_ROUTES = ["/login", "/cadastro", "/recuperar-senha"] as const

/** Públicas e indexáveis. */
export const PUBLIC_ROUTES = ["/", "/concursos", "/oab", "/militar", "/enem"] as const
