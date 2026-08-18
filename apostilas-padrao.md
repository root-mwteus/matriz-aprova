# PADRÃO DE APOSTILAS — MATRIZ APROVA

> Documento de trabalho para criar as apostilas em PDF dos materiais.
> Serve de **padrão editorial** (o que toda apostila deve ter) e de
> **prompt copiável** para o GPT gerar cada apostila com o mesmo formato.
> A lista de matérias no fim indica o que precisa existir no acervo
> cobrindo os concursos curados (`src/lib/gerar-plano/planos-concursos.ts`).

---

## 1. Objetivo

Cada apostila é um material **cirúrgico** de uma disciplina (ou um tema
fechado dela) voltado para a forma como a banca cobra. Não é um livro
completo — é o "o que cai, direto ao ponto", com teoria essencial,
exemplos e questões comentadas. O aluno lê, resolve e avança.

O que define uma boa apostila aqui:
- **Rapidez**: 10–15 páginas lidas em uma sessão de estudo.
- **Foco em prova**: teoria alinhada ao edital/incidência, não ao índice
  de um curso de graduação.
- **Aplicável**: termina em questões comentadas, nunca em teoria solta.

---

## 2. Padrão editorial (estrutura obrigatória)

Toda apostila segue a mesma espinha dorsal. Ordem fixa:

### 2.1. Cabeçalho
- Título: `Apostila — <Matéria>: <Tema>`
- Subtítulo: concurso(s) a que se destina + banca
- Etiqueta de incidência: percentual estimado na banca
- Data de atualização e autor (nome do gerador + versão)

### 2.2. "O que cai" (abertura, 1 página)
- Resumo de como a banca cobra o tema (objetiva? casos? decoreba de lei?)
- 3–5 tópicos que são **quase certeza** na prova
- Indicação de quanto vale o tema no contexto do edital

### 2.3. Teoria essencial (núcleo, 60–70% da apostila)
- Subdividida em seções numeradas, cada uma fechando um ponto do edital
- **Lei seca em destaque**: artigos, parágrafos e súmulas transcritos
  quando o tema for jurídico; fórmulas e teoremas destacados em exatas
- Parágrafos curtos, tópicos e quadros em vez de texto corrido
- **Não encher linguiça**: se a banca não cobra, não entra

### 2.4. Exemplos resolvidos
- 2–3 exemplos que mostram o raciocínio aplicado (passo a passo)
- Casos práticos estilo banca (jurisprudência, situação-problema)

### 2.5. Quadro-resumo
- Tabela ou lista de 5–10 linhas que o aluno pode revisar em 2 minutos
- Contraste os pontos que a banca costuma confundir (ex.: "cabe / não cabe")

### 2.6. Questões comentadas (encerramento)
- **5 questões** do estilo da banca (idealmente reais; se geradas, marcar)
- Cada uma com: enunciado, alternativas, gabarito e comentário explicando
  por que a certa é certa e por que as distratoras são erradas
- Fechar com "O que revisar antes da prova" (lista curta)

### 2.7. Regras de estilo
- Português do Brasil, tom de professor que simplifica sem simplismo
- Sem gíria, sem coloquialismo excessivo, sem adjetivos de venda
- Citações normativas com fonte (CF art. X, Lei n.º Y, Súmula Z)
- Sem dados inventados: se não souber a incidência, use faixa conservadora
- Extensão alvo: **2.800–4.200 palavras** (≈ 10–15 páginas em PDF)

---

## 3. Prompt mestre (copiar e colar)

Para gerar uma apostila, copie o bloco abaixo e substitua o que está
entre `{{ }}`. Use-o inteiro; o gerador respeita o padrão.

```
Você é professor de cursos preparatórios para concursos públicos e autor
de apostilas objetivas. Vou pedir UMA apostila completa. Siga o padrão
abaixo EXATAMENTE — mesma estrutura, mesmo tom, mesmo tipo de fechamento.

## Apostila a criar
- Matéria: {{MATERIA}}
- Tema: {{TEMA}}
- Concurso(s)-alvo: {{CONCURSOS}}
- Banca: {{BANCA}}
- Incidência estimada: {{INCIDENCIA_PCT}}% na banca
- Perfil da prova: {{PERFIL}}   (ex.: objetiva com 1 alternativa correta,
  5 alternativas A–E, cobrança de lei seca e jurisprudência)

## Estrutura obrigatória (nesta ordem)
1. Cabeçalho: título, subtítulo com concursos+banca, incidência, data.
2. Seção "O que cai": como a banca cobra, 3–5 pontos quase certeza, valor
   do tema no edital. Máximo 1 página.
3. Teoria essencial em seções numeradas, fechando cada ponto do edital.
   Lei seca em destaque (artigos/parágrafos/súmulas para direito;
   fórmulas/teoremas destacados para exatas). Parágrafos curtos, tópicos,
   quadros. Nada do que a banca não cobra.
4. Exemplos resolvidos: 2–3, passo a passo, estilo banca.
5. Quadro-resumo: tabela de 5–10 linhas revisável em 2 minutos, com os
   contrastes que a banca costuma cobrar (cabe/não cabe, etc.).
6. 5 questões comentadas estilo {{BANCA}}: enunciado, alternativas A–E,
   gabarito e comentário explicando certa e distratoras. Se as questões
   forem reais, cite a origem; se geradas, escreva "(questão gerada)".
7. Fechamento: "O que revisar antes da prova" — lista curta e prática.

## Regras de estilo
- Português do Brasil, tom de professor, direto ao ponto.
- Sem gíria, sem coloquialismo excessivo, sem adjetivos de venda.
- Citações normativas com fonte completa; nunca invente lei, súmula,
  jurisprudência, fórmula ou dado.
- Extensão alvo: 2.800–4.200 palavras. Nada de conteúdo fora do edital.
- Saída em Markdown com título H1 e seções H2/H3.
```

### 3.1. Exemplo preenchido (um modelo real)

```
Você é professor de cursos preparatórios para concursos públicos e autor
de apostilas objetivas. Vou pedir UMA apostila completa. Siga o padrão
abaixo EXATAMENTE — mesma estrutura, mesmo tom, mesmo tipo de fechamento.

## Apostila a criar
- Matéria: Direito Constitucional
- Tema: Controle de Constitucionalidade
- Concurso(s)-alvo: Receita Federal, PRF, INSS
- Banca: a definir (estilo CESPE/CEBRASPE)
- Incidência estimada: 40% na banca
- Perfil da prova: objetiva, 5 alternativas A–E, cobrança de lei seca,
  súmulas e jurisprudência do STF
...
```

---

## 4. Metadados para cadastro no admin

Ao subir a apostila em `/admin/materiais/novo`, preencha:

| Campo | Como preencher |
|---|---|
| Título | `Apostila — <Matéria>: <Tema>` |
| Matéria | disciplina (mesmo nome usado nos concursos curados) |
| Submatéria | tema fechado (ex.: "Controle de constitucionalidade") |
| Banca | banca principal, ou "a definir" |
| Professor | `Matriz Aprova` (autor é a plataforma) |
| Incidência | o percentual usado no prompt |
| IA recomenda | ligado quando a matéria tem peso alto no plano curado |

> Observação: o `select` de matéria no admin usa a lista `MATERIAS`
> (`src/lib/constants.ts`). Se a apostila for de uma disciplina fora
> dessa lista (ex.: Direito Tributário, Física, Redação), digite a
> matéria correta no campo — o banco aceita texto livre — ou adicione a
> disciplina à lista, se ela passar a ser recorrente.

---

## 5. Matérias necessárias por área

Lista consolidada dos concursos curados em
`src/lib/gerar-plano/planos-concursos.ts`. Prioridade: **A** = quase todo
concurso da área cobra / peso alto no plano; **B** = carreira específica;
**C** = alta exigência / nicho.

### 5.1. Concursos Gerais (fiscal, tribunais, polícia, estatais)

| Matéria | Cobrada em | Prioridade |
|---|---|---|
| Português | todos os concursos | **A** |
| Direito Constitucional | Receita, CGU, PRF, PF, INSS, TRT, TCU, Bacen, PC | **A** |
| Direito Administrativo | Receita, CGU, PRF, PF, INSS, TRT, TCU, PC, Câmara | **A** |
| Raciocínio Lógico | quase todos | **A** |
| Informática | quase todos (Pacote Office, SO, redes, segurança) | **A** |
| Atualidades | INSS, Petrobras, Câmara, TRT | **B** |
| Legislação | PRF, PC RJ, Petrobras, Câmara | **B** |
| Direito Penal | PRF, PF, PC RJ | **B** |
| Direito Processual Penal | PF, PC RJ | **B** |
| Direitos Humanos | PRF, PF | **B** |
| Direito Tributário | Receita Federal (peso alto) | **B** |
| Contabilidade | Receita, CGU, TCU, Bacen | **B** |
| Direito Financeiro | CGU, TCU | **B** |
| Auditoria | CGU, TCU | **B** |
| Estatística | Receita, Bacen | **B** |
| Economia / Finanças | Bacen | **C** |
| Inglês | Bacen, Petrobras | **C** |
| Direito Previdenciário | INSS (peso alto) | **B** |
| Direito do Trabalho | TRT (peso alto) | **B** |
| Direito Processual do Trabalho | TRT | **B** |
| Matemática Financeira | Bacen, Petrobras | **C** |

### 5.2. OAB (Exame de Ordem — banca FGV, 1ª fase)

| Matéria | Prioridade |
|---|---|
| Direito Constitucional | **A** |
| Direito Administrativo | **A** |
| Direito Civil | **A** |
| Direito Processual Civil | **A** |
| Direito Penal | **A** |
| Direito Processual Penal | **A** |
| Direito do Trabalho | **A** |
| Direito Processual do Trabalho | **A** |
| Direito Tributário | **B** |
| Direito Empresarial | **B** |
| Estatuto da Advocacia e Código de Ética | **A** (diferenciador) |
| Direitos Humanos | **C** |
| Direito Ambiental | **C** |
| Direito do Consumidor | **C** |
| Filosofia do Direito | **C** |
| Direito Internacional | **C** |

### 5.3. Militar (ESA, EsPCEx, EEAR, AFA, ITA, IME, EFOMM, Escola Naval)

| Matéria | Cobrada em | Prioridade |
|---|---|---|
| Português | todas | **A** |
| Matemática | todas (peso alto em todas) | **A** |
| Física | EsPCEx, EEAR, AFA, ITA, IME, EFOMM, Escola Naval | **A** |
| Química | EsPCEx, AFA, ITA, IME, EFOMM, Escola Naval | **A** |
| Inglês | todas | **A** |
| Redação | EsPCEx, AFA, EFOMM, Escola Naval | **A** |
| História | ESA, EsPCEx | **B** |
| Geografia | ESA, EsPCEx | **B** |
| Conhecimentos Militares | ESA | **C** |
| Conhecimentos Específicos (por força) | EEAR | **C** |

> ITA/IME exigem profundidade de exatas (nível C de dificuldade, mas
> prioridade alta para quem presta — apostila de revisão de topo de
> assunto, não de introdução).

### 5.4. ENEM (banca INEP)

| Matéria | Prioridade |
|---|---|
| Linguagens, Códigos e suas Tecnologias | **A** |
| Matemática e suas Tecnologias | **A** |
| Ciências da Natureza (Física, Química, Biologia) | **A** |
| Ciências Humanas (História, Geografia, Filosofia, Sociologia) | **A** |
| Redação (dissertativo-argumentativa, 5 competências) | **A** |

---

## 6. Ordem sugerida de produção

Priorize o que cobre mais alunos de uma vez (impacto × frequência):

1. **Português** (universal — 1 apostila de teoria + 1 de interpretação)
2. **Direito Constitucional** (base de concursos gerais + OAB)
3. **Direito Administrativo** (idem)
4. **Raciocínio Lógico / Matemática básica** (universal)
5. **Informática** (concursos gerais)
6. **Direito Penal** e **Processo Penal** (carreiras policiais)
7. **Direito do Trabalho** (TRT + OAB)
8. **Direito Tributário** (Receita)
9. **Direito Previdenciário** (INSS)
10. **Contabilidade** (fiscal/controle)
11. Militar: **Física** e **Química** de nível médio
12. ENEM: **Redação** (maior impacto isolado no ENEM)

---

## 7. Checklist antes de subir a apostila

- [ ] Segue a estrutura das seções 2.2–2.6 (o que cai → teoria → exemplos →
      quadro → 5 questões comentadas)
- [ ] Extensão entre 2.800 e 4.200 palavras
- [ ] Nenhuma lei, súmula, fórmula ou dado inventado
- [ ] Título e matéria corretos no cadastro; incidência coerente
- [ ] PDF legível (tipografia, cabeçalho, quebras) e sem texto cortado
- [ ] Revisão de português (acentuação, concordância)
- [ ] ID do material cadastrado bate com o arquivo enviado ao storage a