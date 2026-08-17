# CONTEXT — MATRIZ APROVA

Documento único de contexto do projeto. Leia este arquivo para entender a base
sem explorar o código todo. Mantenha atualizado ao mudar arquivos, tabelas ou rotas.

## Visão geral

Plataforma de estudos para concursos (site vitrine + painel pago). Plano pago é
**vitalício** via Mercado Pago Checkout Pro; usuários novos entram como plano
**demo** (100% trancado — `ROTAS_LIBERADAS = []` em `src/components/PaywallLock.tsx`).
O conteúdo do produto: questões com alternativas A–E (KaTeX), simulados com
correção no servidor, materiais em PDF, editais com alertas, plano de estudos por IA
(OpenAI), cronômetro, comunidade (chat/grupos/ranking), ligas semanais, duelos 1v1.

Código, comentários, nomes de rota/tabela e textos de UI: **pt-BR**. Sem comentários
desnecessários em código novo (comentários de "porquê" em blocos são aceitos e usados).

## Stack

- **Next.js 14.2.4** (App Router, `src/app`), React 18, TypeScript 5.4
- **Supabase**: Auth (email+senha, Google OAuth, PKCE), Postgres (RLS), Storage, Realtime
  - `@supabase/ssr 0.4.0` + `@supabase/supabase-js 2.43`
  - Clients: `src/lib/supabase/client.ts` (browser PKCE), `server.ts` (server/cookies),
    `service.ts` (service-role, bypass RLS), `auth.ts` (requireUser/requireUserSupabase),
    `session.ts` (sessão única), `register-session.ts`, `admin.ts` (requireAdmin via service role)
- **Mercado Pago** Checkout Pro (webhook com assinatura HMAC) — `src/lib/mercadopago.ts`
- **Resend** e-mails transacionais — `src/lib/email.ts`
- **OpenAI** refino de focos do plano de estudos — `src/lib/gerar-plano`
  (gerador determinístico por semanas com curadoria; IA opcional, fallback local)
- **UI**: Tailwind 3, framer-motion, lucide-react, sonner (toasts), recharts (gráficos),
  katex (LaTeX em questões), UI kit em `src/components/ui/`
- **Sentry** + Vercel Analytics; vitest para testes (`npm test`)

## Comandos

```bash
npm run dev        # dev server
npm test           # vitest run (testes em src/**/__tests__/*.test.ts)
npm run lint       # next lint
npx tsc --noEmit   # typecheck
npm run build      # produção
```

Validação esperada antes de concluir feature: **91/91 testes, lint limpo, tsc limpo.**

## Rotas do app (`src/app`)

### Públicas / marketing
- `/` landing, `/concursos` `/oab` `/militar` `/enem` (áreas), `/assinar` (checkout),
  `/termos` `/privacidade`, `/login` `/cadastro` `/recuperar-senha` (AuthShell),
  `/onboarding` (pós-cadastro), `/auth/redefinir-senha`

### Painel `(dashboard)` — protegidas por middleware (`PROTECTED_ROUTES` em `src/lib/routes.ts`)
- `/dashboard` `/plano` `/seguranca` `/perfil` `/cronometro` `/materiais` `/editais` `/estatisticas`
- `/questoes` `/questoes/resolver` `/questoes/[id]` `/questoes/historico`
- `/simulados` `/simulados/[id]` `/simulados/resultado/[id]` `/simulados/ranking`
- `/comunidade` `/comunidade/[id]` `/comunidade/ligas` `/comunidade/duelos`
- Layout único `DashboardShell`: sidebar, breadcrumbs, CommandPalette (⌘K),
  PaywallBanner + PaywallLock (demo) + SecaoLock (bloqueio admin por seção)

### Admin `/admin` — `requireAdmin` no middleware
- `/admin/dashboard` `/admin/usuarios` `/admin/usuarios/[id]` `/admin/financeiro`
  `/admin/questoes(+novo,editar)` `/admin/simulados` `/admin/editais` `/admin/materiais`
  `/admin/cursos(+[id])` `/admin/bloqueios` `/admin/molduras`
- Nav e breadcrumbs em `src/app/admin/layout.tsx` (`navGroups` + `labels`)

## APIs (`src/app/api`)

- `auth/sessao` — registra sessão + evento de login + e-mail de alerta
- `auth/recuperar-senha` — POST público; gera link recovery via admin client
  (`generateLink`) e envia pela Resend (`sendRecuperarSenha`); resposta neutra
  p/ não vazar cadastros; rate-limit 5/h por IP
- `pagamentos/checkout` — preferência MP (preço da config, desconto de indicação, idempotente)
- `pagamentos/webhook` — HMAC, valida valor/status, idempotente por `mp_payment_id`, sempre 200
- `pagamentos/config` — público (preço/título)
- `questoes/responder` — valida no servidor, vitalício apenas
- `simulados/ranking` · `simulados/[id]/finalizar` — scoring no servidor, anti-cheat, máx 3h
  Cadernos completos usam `simulados_catalogo` + `simulados_catalogo_questoes`;
  conteúdo em `materiais/simulados/` e importação via `importar-simulados.mjs`.
- `seguranca/logins` — histórico + sessão atual
- `comunidade/*` — chat, grupos, membros, ligas (`ranking_liga`), ranking, nomes em lote
- `duelos` · `duelos/[id]` · `duelos/[id]/responder` — fila rápida com UPDATE condicional;
  `duelos` e `duelos/[id]` devolvem `jogadores` (nome/ícone/moldura) para mostrar o oponente
- `indicacoes` — GET código/usos, POST registra (UNIQUE por indicado)
- `gerar-plano` — curadoria por concurso + semanas até a prova, persistência
  em `planos_estudo`/`plano_semanas`, refino de focos via IA (fallback local)
- `plano/desbloquear-semana` — liberação progressiva de semanas (concluída OU data passou)
- `materiais/[id]/baixar` — signed URL 60s, vitalício
- `email/boas-vindas` — rate limit 5/h, só e-mail da própria sessão
- `cron/editais-alertas` — Bearer CRON_SECRET, dedupe por PK `edital_alertas`
- `admin/*` — dashboard, usuarios/[id], simulados, pagamentos, pagamentos/config (PUT valor texto "49,99")

## Componentes principais (`src/components`)

- `DashboardShell` — shell do painel (drawer, dark, breadcrumbs); empilha
  `PaywallLock` > `SecaoLock` > children
- `Sidebar`, `CommandPalette`, `PageHeader`
- `PaywallBanner` (dispensável, localStorage `paywall_dispensado`), `PaywallLock`
  (blur+cadeado, `ROTAS_LIBERADAS = []`), `SecaoLock` (lê `bloqueios_secao`, só visual)
- `LatexText` (KaTeX, 4 delimitadores + fallback Unicode)
- `comunidade/Chat` (Realtime `mensagens`, presence, digitando), `comunidade/Ranking`,
  `comunidade/PerfilAvatar` (ícone + moldura, cache de molduras p/ rankings/ligas/duelos)
- `AuthShell`, `GoogleButton`, `PasswordInput`, `ThemeToggle`
- Admin: `QuestaoForm`, `UploadZone`, `AdminTable`, `MetricCard`, `ConfirmModal`, `StatusBadge`
- UI kit: `src/components/ui/` (Button, Field, Panel, Badge, Skeleton, Stat, Modal,
  Menu, Tooltip, Tabs, Table/DataTable/Pagination, Toolbar/FilterSelect, EmptyState, IconButton)
- Charts: `src/components/charts/ChartKit.tsx` (useChartTheme lê CSS vars `--chart-1..4`,
  ChartFrame com alternativa em tabela p/ acessibilidade)
- `xp/NivelPanel` — nível + barra de XP até o próximo nível (dashboard e `/perfil`)

## Lib (`src/lib`)

- `constants.ts` — SITE_NAME, 12 MATERIAS, 8 BANCAS, 4 AREAS, 11 ANOS
- `navigation.ts` — 3 grupos (Estudar/Conteúdo/Acompanhar), breadcrumbs, `isRouteActive`
- `routes.ts` — `PROTECTED_ROUTES`, `AUTH_ROUTES`, `PUBLIC_ROUTES`
- `auth-validation.ts` — zod: login/register/forgot/redefinirSenha
- `mercadopago.ts` — Checkout Pro; `isTestMode` (TEST-); HMAC webhook; parse payment_id
- `email.ts` — Resend: `sendBoasVindas`, `sendAlertaEdital`, `sendAvisoLogin`,
  `sendRecuperarSenha`;
  FROM `onboarding@resend.dev` (dev) vs `noreply@matrizaprova.com` (prod)
- `liga.ts` — PONTOS (resposta 1, acerto 2, simulado 5, duelo 10/5/2); semana inicia 2ª UTC
- `duelo.ts` — 5 questões, busca 2min, partida 10min, desempate por tempo
- `xp.ts` — XP: ganhos (resposta 10, acerto 10, simulado 50, duelo 100/50/25),
  curva triangular de níveis (`nivelDeXp`/`xpProximoNivel`), `somarXp` (rpc
  com dedupe por origem + teto diário, falha silenciosa)
- `perfil.ts` — regras do perfil público: limites (ícone 5MB, banner 8MB, bio 160),
  `moldurasDesbloqueadas`/`molduraUsavel`, `publicUrl` (bucket público)
- `bloqueios.ts` — `SECOES_PAINEL` (8 seções) + `secaoDaRota` (prefixo mais longo)
- `gerar-plano/` — `planos-concursos.ts` (curadoria de 21 concursos, `PLANO_PADRAO`,
  `encontrarConcurso`, `concursosPorArea`), `gerar-plano.ts` (gerador determinístico
  por semanas, 3 fases, `calcularSemanas` 1–52), `prompt.ts` (refino de focos via IA,
  `gpt-4o-mini`, nunca lança)
- `materiais/` — template visual `template-apostila.tex`, prompt econômico
  `prompts/prompt-apostila.txt`, apostilas em Markdown e o conversor
  `gerar-latex.mjs` (md → LaTeX preenchendo o template; gere `.tex` ao lado de
  cada `.md` com `node materiais/gerar-latex.mjs`), compiláveis com XeLaTeX
  para PDF: Português/interpretação de texto, gramática aplicada e Português completo, Matemática/matemática geral,
  Direito Constitucional/princípios
  fundamentais, Direito Administrativo/princípios da Administração Pública,
  Raciocínio Lógico/proposições e conectivos, Informática/segurança da informação
  e Direito Penal/princípios e aplicação da lei penal. Também inclui Direito
  Processual Penal/inquérito policial, Física/cinemática e dinâmica, Química/fundamentos e estequiometria,
  Direito do Trabalho/relação de emprego,
  Direito Tributário/princípios e limitações ao poder de tributar, Redação/texto
  dissertativo-argumentativo para ENEM, Direito
  Previdenciário/benefícios e regras gerais do RGPS e Contabilidade/patrimônio
  e equação contábil. `importar-pdfs.mjs` sobe os PDFs gerados para o bucket
  `materiais` (`apostilas/<disciplina>/<arquivo>.pdf`, upsert) e grava/atualiza
  a linha em `materials`; `node materiais/importar-pdfs.mjs --validate` lista
  o que seria importado sem tocar no Supabase.
- `pagamentos-config.ts` — `config_pagamentos` id=1; `formatarValor`, `parseValorParaCentavos`,
  desconto indicação 10% (`desconto_indicacao_pct`)
- `login-alert.ts` — UA parsing, IP de headers, `notifyLogin`, `registrarLoginEvento`
- `supabase/` — client, server, service, auth, session, register-session, admin
- `utils.ts` — `cn`, `diasAte`, formatadores

## Banco de dados (Supabase)

Migrações em `supabase/supabase-migration-NNN-*.sql` (avulsas, **não** em
`supabase/migrations/`). `supabase-schema.sql` consolidado está DESATUALIZADO
(a partir da 013+; as migrações são a fonte da verdade).

**Tabelas:** `profiles` (plano demo/vitalício, `suspended`, `codigo_indicacao`,
perfil público: `bio`, `prova_alvo`, `icone_path`, `banner_path`, `moldura_id`,
`xp_total` — XP acumulado, nível é função pura em `src/lib/xp.ts`),
`molduras` (catálogo de molduras de avatar: `slug`, `nome`, `arquivo`,
`desbloqueio` `livre`/`vitalicio`; PNG 512×512 transparente em `molduras/<slug>.png`),
`xp_historico` (razão de XP: `tipo`/`origem_id` UNIQUE por user — dedupe de retry
+ teto diário de 1000 XP em `somar_xp`),
`questions` (5 alternativas, matéria/banca/área), `user_answers`, `simulations`,
`pagamentos` (referencia `config_pagamentos.valor` no webhook), `config_pagamentos`
(id=1, singleton; inclui `whatsapp_suporte` do balão de suporte), `editais`
(status `aberto`/`encerrado`/`previsto`/`sem_edital`; seed em
`scripts/seed-editais.mjs`, PDFs dos editais principais em `editais/`),
`edital_alertas` (PK dedupe alertas),
`courses`/`modules`/`lessons`/`progress`, `materials`, `mensagens`/`grupos`/`membros`,
`study_sessions`, `study_plans` (legado, 1 semana), `planos_estudo` (concurso,
data_prova, horas_por_dia, semanas_total, semana_liberada) + `plano_semanas`
(plano_id, numero, semana_inicio, foco, tarefas jsonb, concluido),
`user_sessions` (sessão única), `login_events`,
`liga_pontos`, `duelos`, `indicacoes` (código de indicação + usos), `bloqueios_secao`
(secao PK, bloqueado, mensagem).

**Funções:** `is_admin()` (SECURITY DEFINER), `gerar_codigo_indicacao()`,
`ranking_questoes`, `ranking_grupo`, `ranking_liga`, `somar_pontos_liga`,
`somar_xp` (SECURITY DEFINER — soma XP com dedupe por origem e teto diário).

**RLS:** por usuário em profiles/user_answers/simulations; admin via `profiles.role = 'admin'`
(escrita de questões/editais/bloqueios/molduras); leitura de molduras/bloqueios para qualquer
autenticado; escritas de sessão/indicacoes/login_events via service role (sem policy client).

**Storage:** `materiais` (privado), `questoes-figuras` (público), `pdf-provas` (privado),
`perfis` (público, upload só na própria pasta `perfis/<user_id>/`), `molduras` (público, admin).

## Integrações / env (`NEXT_PUBLIC_SUPABASE_URL`, `..._ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`,
`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`,
`SENTRY_AUTH_TOKEN`)

- Vercel: cron `/api/cron/editais-alertas` `0 12 * * *` (região `gru1`)
- `SUPABASE_SERVICE_ROLE_KEY` é necessária para registrar sessão/indicacao/login_event
- `CRON_SECRET` obrigatória no cron (Bearer) — sem ela o cron recusa tudo

## Status de migrações

Aplicadas no Supabase (verificado via OpenAPI `/rest/v1/`): `003`, `017-sessao-unica`,
`018-alertas-dispositivos`, `019-ligas-duelos`, `020-indicacoes`, `021-bloqueios-secao`,
`022-planos-semanas`, `023-simulados-completos`, `024-catalogo-simulados`,
`026-editais-sem-edital`.

Pendentes (criadas, **NÃO aplicadas**):
- `025-whatsapp-suporte` (`config_pagamentos.whatsapp_suporte` — balão de suporte)
- `027-perfil-molduras` (perfil público: `bio`, `prova_alvo`, `icone_path`,
  `banner_path`, `moldura_id`; tabela `molduras` + buckets `perfis`/`molduras`
  com RLS — sem ela, `/perfil` e avatares na comunidade não funcionam)
- `028-niveis-xp` (`profiles.xp_total` + razão `xp_historico` + `somar_xp` com
  dedupe por origem e teto diário de 1000 XP — sem ela o XP não acumula; o
  resto do app funciona, o nível aparece como 1)

Passos para ativação em produção: rodar migrações pendentes no SQL Editor do Supabase,
configurar `SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET` (local + Vercel), fazer deploy.

## Regras de trabalho

- Antes de implementar, apresentar plano (skill `implementation-planner`); aguardar aprovação.
- Usar `SECOES_PAINEL` como fonte da verdade p/ seções do painel; adicionar novas seções lá + seed.
- Validação final sempre: `npm test`, `npm run lint`, `npx tsc --noEmit`.
- Nunca commitar sem pedido explícito. Não criar arquivos de docs sem pedido (este arquivo foi pedido).
