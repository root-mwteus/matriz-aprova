# Extrator de Questões — Prompt para IA

> Converte **blocos de texto brutos** (extraídos de PDF via `pdfjs-dist` ou HTML via `cheerio`) em **JSON estruturado** no formato que `importar-simulados.mjs` já persiste com `upsert(codigo_importacao)`.
> Comentários em pt-BR explicando o “porquê”. O prompt nunca inventa gabarito — quando a fonte não traz resposta, marca como `null` para revisão humana obrigatória no preview.

---

## 1. Objetivo

Extrair de provas, PDFs de banca ou páginas públicas **questões objetivas A–E** com fidelidade total ao enunciado original (incluindo LaTeX/KaTeX) e devolver um array validado por `zod` que o `/api/admin/questoes/importar/confirmar` persiste.

Entrada: `string` com 1..50 questões concatenadas (chunk de ~8k chars, com overlap de 500 chars para não cortar questão no meio).

Saída: `questoes[]` estritamente conforme schema abaixo. Nenhum texto fora do JSON.

---

## 2. Schema (zod) — fonte da verdade

```ts
import { z } from "zod"

const Alternativa = z.object({
  letra: z.enum(["A","B","C","D","E"]),
  texto: z.string().min(1).max(5000),
})

const QuestaoExtraida = z.object({
  ordem: z.number().int().min(1).describe("ordem dentro do chunk, 1..N"),
  materia: z.enum(MATERIAS), // de src/lib/constants.ts — 12 valores
  sub_materia: z.string().nullable(),
  banca: z.enum(BANCAS).nullable(), // 8 valores ou null se não dedutível
  ano: z.number().int().min(1990).max(2030).nullable(),
  nivel: z.enum(["facil","medio","dificil"]).nullable(),
  enunciado: z.string().min(10).max(8000),
  texto_referencia: z.string().nullable().describe("texto base da questão, se houver"),
  alternativas: z.array(Alternativa).length(5),
  resposta_correta: z.number().int().min(0).max(4).nullable()
    .describe("índice 0=A ... 4=E; null se gabarito não estiver na fonte"),
  explicacao: z.string().nullable(),
  referencias: z.array(z.string()).default([]),
  origem: z.enum(["pública","inédita","adaptada"]).default("adaptada"),
  fonte_url: z.string().url().nullable(),
  confianca: z.number().min(0).max(1).describe("0.9+ só se gabarito veio da fonte"),
  figuras: z.array(z.object({
    legenda: z.string().nullable(),
    // preenchido depois pelo extrator de imagens do PDF, não pela IA
  })).default([]),
})
export const RespostaIA = z.object({ questoes: z.array(QuestaoExtraida) })
```

- `materia` SEMPRE preenchida — quando a fonte não rotula, inferir pela redação (ex.: “art. 5º CF” → `Direito Constitucional`).
- `resposta_correta: null` é válido e força revisão humana no preview (badge amarelo). Nunca chutar.

---

## 3. Regras de extração (por quê cada uma)

1. **Fidelidade literal** — copiar `enunciado` e `alternativas` exatamente como na fonte, sem resumir, sem corrigir português, sem remover “( )” ou numeração. Só normalizar espaços duplos. *Por quê:* prova cobra literalidade; paráfrase invalida a questão.
2. **LaTeX/KaTeX** — converter símbolos para delimitadores que `LatexText` entende: `\( ... \)`, `\[ ... \]`, `$...$`, `$$...$$`. Ex.: “x²” → `\(x^2\)`. *Por quê:* `LatexText` renderiza 4 delimitadores com fallback Unicode.
3. **Alternativas A–E** — sempre 5, ordem original. Se a fonte traz “a)`, “A.”, “1)”, normalizar para `A`..`E`. Se vier 4 alternativas, criar a 5ª como `null` e marcar `confianca: 0.4` (preview exige completar).
4. **Gabarito** — só preencher `resposta_correta` se a fonte trouxer gabarito explícito na mesma página/bloco (“Gabarito: C”, “Resposta: letra B”). Nunca inferir pela IA. Se houver `explicacao` mas sem letra, manter `null`.
5. **Texto de referência** — quando a questão começa com texto-base longo (“Leia o texto abaixo…”), separar em `texto_referencia` e manter `mostrar_texto: true`. Se for só enunciado, `null`.
6. **Banca/ano/nivel** — extrair do cabeçalho do PDF/URL (“CESPE 2023”, “FGV/OAB 2024”). Se ausente, `null` (admin completa no preview). `nivel` só se a fonte classificar.
7. **Dedupe** — não criar `codigo_importacao`; quem cria é o `normalize.ts` (`import:<hash8>:<ordem>`). A IA só devolve `ordem`.
8. **Figuras** — se o texto mencionar “(vide figura)”, “gráfico abaixo”, manter a menção no `enunciado` e deixar `figuras: []` — o extrator de imagens do PDF preenche depois.

---

## 4. Prompt de sistema (copiar literal para `parse-ia.ts`)

```
Você é o extrator de questões da Matriz Aprova.

TAREFA: receber um BLOCO DE TEXTO bruto (de PDF ou HTML já limpo, sem navegação) e devolver APENAS JSON conforme o schema. Nenhum comentário, nenhuma explicação fora do JSON.

REGRAS INEGOCIÁVEIS:
- Copie enunciado e alternativas literalmente; não resuma, não corrija, não invente.
- Converta matemática para KaTeX: \( ... \) para inline, \[ ... \] para display.
- 5 alternativas sempre (A-E). Se faltar, use texto "" e confianca <=0.4.
- resposta_correta só se o gabarito estiver explícito no bloco; caso contrário, null.
- materia é obrigatória; infira se necessário a partir do conteúdo.
- Se o bloco não contiver nenhuma questão objetiva A-E, devolva {"questoes":[]}.
- Nunca alucine banca/ano; use null se não estiver no texto.
- Responda em pt-BR, mas mantenha termos técnicos originais.

FORMATO DE SAÍDA (exato):
{"questoes":[{... conforme schema}]}
```

---

## 5. Prompt de usuário (template por chunk)

```
BLOCO {{i}}/{{total}} — {{fonte}} (banca={{bancaHint}}, url={{fonte_url}})

TEXTO BRUTO (pode conter quebras, cabeçalhos, gabarito ao final):
---
{{TEXTO_CHUNK}}
---

INSTRUÇÕES:
1. Extraia todas as questões A-E deste bloco.
2. Para cada, preencha materia/banca/ano/nivel quando dedutível do cabeçalho; caso contrário null.
3. Converta fórmulas para \( \) ou \[ \].
4. Se o gabarito estiver no bloco (ex.: "Gabarito: ..."), preencha resposta_correta e confianca 0.95; senão null e confianca 0.5.
5. Devolva APENAS o JSON. Não repita o texto bruto.

EXEMPLO DE SAÍDA ESPERADA (1 questão):
{"questoes":[{"ordem":1,"materia":"Direito Constitucional","sub_materia":null,"banca":"CESPE","ano":2023,"nivel":null,"enunciado":"Com base no art. 5º da CF, assinale a alternativa correta. \\(x^2 = 4\\)","texto_referencia":null,"alternativas":[{"letra":"A","texto":"..."},{"letra":"B","texto":"..."},{"letra":"C","texto":"..."},{"letra":"D","texto":"..."},{"letra":"E","texto":"..."}],"resposta_correta":2,"explicacao":null,"referencias":[],"origem":"pública","fonte_url":"https://exemplo.com/prova.pdf","confianca":0.95,"figuras":[]}]}
```

- `{{fonte}}` = `pdf:<nome.pdf>#p{{n}}` ou `url:<url>` — ajuda a IA a preencher `fonte_url`.
- `{{TEXTO_CHUNK}}` = texto já limpo (sem header/footer repetido, sem “Página 1/20”).

---

## 6. Fluxo de chunking (por quê 8k + overlap)

- PDF com 200 páginas → ~300k chars. `pdfjs-dist` extrai por página, remove cabeçalho/rodapé repetido (heurística: linha que se repete em >80% das páginas), junta em `textoCompleto`.
- Divide em chunks de **8k chars** (~2k tokens) com **overlap 500 chars** para não cortar questão no meio. Cada chunk → 1 chamada `gpt-4o-mini` (`temperature: 0`, `response_format: json_object`).
- Junta `questoes` de todos os chunks, reordena por `ordem` global, remove duplicatas por `hash(enunciado)` (Jaccard >0.92).
- Imagens: `pdfjs` `getOperatorList` → `InlineImage` → `upload` em `questoes-figuras/<jobId>/<idx>.png` → `figuras: [{legenda, storage_path}]` (fora da IA).

Custo estimado: 1 PDF de 50 questões (~120k chars) ≈ 6 chunks ≈ 18k tokens input + 12k output ≈ **US$ 0,02** com `gpt-4o-mini`.

---

## 7. Validação e fallback (preview obriga revisão)

- Após IA, `zod.safeParse` — se falhar, tenta `repair` (remove trailing comma, fecha aspas) e revalida; se ainda falhar, marca chunk como `erro` e exibe texto bruto para cópia manual.
- Regras de bloqueio no preview:
  - `alternativas` com texto vazio → borda vermelha, botão Confirmar desabilitado até preencher.
  - `resposta_correta: null` → badge “Sem gabarito — revisar”, `origem` forçada para `adaptada`.
  - `confianca < 0.7` → linha amarela + tooltip “IA baixa confiança — confira”.
  - `materia` fora de `MATERIAS` → select vermelho (admin corrige).
- `Confirmar` só chama `upsert` quando todas as linhas estão válidas — idempotente por `codigo_importacao = import:<hash8DaFonte>:<ordemGlobal>`.

---

## 8. O que NÃO fazer

- Não raspar site com paywall/login sem consentimento; só URLs públicas coladas pelo admin e com `robots.txt` permitindo.
- Não persistir nada antes do Confirmar; `parse` é efêmero (job em memória + `pdf-provas` temporário, expira em 24h).
- Não usar o prompt para gerar questões inéditas — este prompt é só **extração**; geração fica em outro fluxo.

---

## 9. Referências no código

- Normalização e `upsert`: `materiais/simulados/importar-simulados.mjs:1`
- Constantes de domínio: `src/lib/constants.ts` (`MATERIAS`, `BANCAS`)
- Form de questão: `src/components/admin/QuestaoForm.tsx` (payload e validação)
- Tabela e RLS: `supabase/supabase-migration-023-simulados-completos.sql` + `supabase-schema.sql:288`
