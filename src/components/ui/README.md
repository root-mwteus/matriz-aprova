# Sistema de design

Referência curta para manter a interface consistente. A regra geral: se
uma decisão visual já está escrita aqui, ela não se decide de novo na
tela.

## Onde ficam as coisas

| Camada | Arquivo |
|---|---|
| Tokens (cor, sombra, foco, gráficos) | `src/app/globals.css` |
| Exposição dos tokens ao Tailwind | `tailwind.config.ts` |
| Componentes | `src/components/ui/*` |
| Casca da aplicação | `DashboardShell`, `Sidebar`, `PageHeader` |
| Navegação (fonte única) | `src/lib/navigation.ts` |
| Gráficos | `src/components/charts/ChartKit.tsx` |

Importe sempre pelo índice: `import { Button, Panel } from "@/components/ui"`.

## Cor

Os neutros fazem o trabalho; a cor entra para dizer alguma coisa.

- `canvas` fundo · `surface` painéis · `surface-sunken` poços e trilhos
- Texto em quatro níveis: `fg` → `fg-muted` → `fg-subtle` → `fg-faint`.
  Se um texto não couber em nenhum, o problema é de hierarquia, não de cor.
- `accent` (lime) é **preenchimento com texto escuro por cima**. Nunca use
  como texto sobre superfície clara — para isso existe `accent-ink`.
- `positive` / `negative` / `caution` / `info` são reservados a estado.
  Nenhum deles vira "cor de destaque".
- Marcas de gráfico usam `--chart-1…4`, que são tons próprios, validados
  contra as duas superfícies. Não são o `accent`.

Toda cor de estado vem acompanhada de ícone ou texto — cor sozinha não
carrega informação.

## Tipografia

Escala em `tailwind.config.ts`, com *tracking* óptico já embutido.

- `text-sm` (13px) — metadados, rótulos, tabelas
- `text-base` (15px) — corpo padrão da interface
- `text-lg`/`text-xl` — títulos de painel e de página
- Pesos: 400 corpo · 500 ênfase · 560 (`semibold`) títulos · 640 (`bold`) raro

Caixa alta só em `eyebrow` e rótulos de grupo, sempre em 10–11px com
*tracking* aberto. Em qualquer outro lugar ela custa velocidade de leitura.

Números em tabela, métrica ou cronômetro levam `tabular-nums`.

## Espaçamento e raio

Múltiplos de 4. Na prática: `gap-1.5` dentro de um componente, `gap-3`
entre componentes, `space-y-5/6` entre blocos de página.

Raios: `rounded-md` (8px) em controles, `rounded-lg` (10px) em painéis,
`rounded-xl` (12px) em modais, `rounded-full` em badges e avatares.

## Elevação

`shadow-xs` em repouso, `shadow-sm` no hover de algo clicável,
`shadow-md` em balões, `shadow-pop` em modais. Painel dentro de painel
não ganha sombra nova — ganha borda.

## Movimento

- `duration-fast` (90ms) retorno de clique e hover
- `duration-DEFAULT` (140ms) transições de estado
- `duration-slow` (240ms) entrada de camadas e barras de progresso

Só opacidade e `transform`. Nada acima de 240ms, nada que desloque o
conteúdo já lido. `prefers-reduced-motion` está tratado no CSS base.

## Estados obrigatórios

Todo controle interativo precisa de: repouso, hover, foco visível
(`:focus-visible`, anel único), ativo e desabilitado. O componente já
entrega os cinco — reimplementar à mão costuma perder o foco de teclado.

## Escolhas por componente

| Situação | Use |
|---|---|
| Ação principal da tela | `Button variant="accent"` — uma por tela |
| Ação de apoio | `Button variant="secondary"` |
| Ação em tabela ou barra | `Button variant="ghost"` / `IconButton` |
| Agrupar conteúdo | `Panel` |
| Agrupar sem desenhar caixa | `Section` |
| Trocar de seção | `Tabs` |
| Recortar os mesmos dados | `Segmented` |
| Filtrar listagem | `Toolbar` + `FilterSelect` |
| Listar registros | `DataTable` (já traz skeleton, vazio e paginação) |
| Confirmar algo destrutivo | `ConfirmModal destructive` |

`IconButton` exige `label`. `Field` cuida de rótulo, dica, erro e das
associações ARIA — não monte formulário com `<label>` solto.

## O que não fazer

- Hex solto em componente. Se falta um token, crie o token.
- Caixa alta em botão, item de menu ou título de painel.
- Sombra colorida, brilho, gradiente decorativo.
- Emoji como ícone de interface (use `lucide-react`).
- Estado vazio sem ação de saída.
- Cor como único indicador de certo/errado.
