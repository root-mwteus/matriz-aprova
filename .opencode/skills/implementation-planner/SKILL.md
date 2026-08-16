---
name: implementation-planner
description: Produces a structured implementation plan before writing any code — covering affected files, ordered steps, migrations, env vars, tests, validation commands, and rollback. Use when implementing changes, features, bug fixes, or refactors, whenever the user asks to implement, change, add, fix, or refactor something. Present the plan BEFORE touching files.
license: MIT
compatibility: opencode
metadata:
  version: "1.0.0"
  domain: workflow
  triggers: plano, implementação, implementar, mudança, alteração, feature, correção, refactor
  role: specialist
  scope: planning
  output-format: plan
  related-skills: feature-forge, code-reviewer
---

# Implementation Planner

Sempre produza um plano de implementação ANTES de escrever código — e só execute depois de apresentá-lo ao usuário.

## Quando usar

- Qualquer pedido de implementar, alterar, adicionar, corrigir ou refatorar
- "implemente X", "adiciona Y", "conserta Z", "refatora W"
- Mesmo que o pedido pareça pequeno: o plano pode ser curto, mas existe

## Fluxo obrigatório

1. **Explorar antes de planejar** — use Glob/Grep/Read (ou agente explore para escopo maior) para entender como o codebase faz coisas parecidas hoje. Plano sem leitura prévia é adivinhação.
2. **Apresentar o plano** no formato abaixo e PARAR, aguardando o usuário confirmar ou ajustar.
3. **Executar** só após aprovação, seguindo o plano (todowrite para ≥3 passos).
4. **Validar** com os comandos de checagem do projeto e reportar resultados.

Se o usuário já deu todos os detalhes e o escopo é trivial (um arquivo, mudança mecânica), apresente o plano em 3–5 linhas e pergunte "posso aplicar?" — não precisa de cerimônia.

## Formato do plano

```markdown
## Objetivo
[uma frase: o que muda e por quê]

## Como funciona
[2–5 frases ou bullets: a decisão técnica central e por quê essa abordagem]

## Arquivos
| Arquivo | Ação | O que faz |
|---|---|---|
| caminho/relativo.ts | novo/editar | resumo da mudança |

## Passos
1. [passo ordenado, um por linha, verbos no infinitivo]
2. ...

## Migrações / Env vars
- [SQL a rodar, variável nova, ou "nenhuma"]

## Testes e validação
- [testes novos a escrever]
- `npm run lint` · `npx tsc --noEmit` · `npm test`

## Riscos e rollback
- [o que pode quebrar e como reverter]
```

## Regras

### MUST DO
- Ler o código relevante ANTES de planejar; citar arquivos reais com caminhos que existem
- Seguir as convenções do projeto (comentários em pt-BR explicando o "porquê", padrões dos arquivos vizinhos, bibliotecas já instaladas)
- Migrações SQL em `supabase/supabase-migration-NNN-<nome>.sql` (idempotentes, RLS sempre) e refletir no `supabase-schema.sql` consolidado
- Todo fluxo autenticado passa por `src/middleware.ts` (páginas) E `requireUser()`/`getSessionUser()` em `src/lib/supabase/auth.ts` (APIs — o middleware não cobre `/api`)
- Se um bug pre-existing bloquear a validação (ex.: lint quebrado em arquivo intocado), corrigir o mínimo e avisar
- Terminar sempre rodando `npm run lint`, `npx tsc --noEmit` e `npm test` (se aplicável)

### MUST NOT
- Não escrever código antes do plano ser apresentado
- Não propor biblioteca nova sem checar package.json primeiro
- Não adicionar dependência quando o projeto já tem util equivalente
- Não deixar segredo/chave em código ou commit

## Stack deste projeto (atalhos de decisão)

- Next.js 14 App Router + Supabase (`@supabase/ssr`): clientes em `src/lib/supabase/{client,server,service,admin}.ts`
- E-mail transacional: Resend (`src/lib/email.ts`), templates text+html, falha nunca bloqueia fluxo
- Testes: Vitest em `src/lib/__tests__/`, alias `@` → `src/`
- Pagamentos: Mercado Pago · Erros: Sentry · Formulários: zod (`src/lib/auth-validation.ts`)
- Rotas: listas em `src/lib/routes.ts` (PROTECTED/AUTH/PUBLIC) — não hardcode
