# O que cai

**Matéria:** Raciocínio Lógico  
**Tema:** Proposições e conectivos  
**Concursos-alvo:** Receita Federal, CGU, PRF, Polícia Federal, INSS, TRT, TCU/TCE, Câmara e Petrobras  
**Banca de referência:** Cebraspe, FCC e similares

Este é o ponto de partida para lógica proposicional. As questões normalmente
exploram classificação de frases, negação, conectivos, valor lógico e
equivalências básicas.

Pontos de maior incidência:

1. reconhecer se uma frase é ou não uma proposição;
2. identificar proposições simples e compostas;
3. interpretar `e`, `ou`, `se... então` e `se e somente se`;
4. negar corretamente uma proposição composta;
5. calcular o número de linhas de uma tabela-verdade;
6. diferenciar condição suficiente de condição necessária.

**Regra de prova:** antes de montar uma tabela, traduza o enunciado para
símbolos. A maior parte dos erros nasce de interpretar mal o conectivo.

# Teoria essencial

## 1. Proposição

Proposição é uma frase declarativa que pode ser classificada como verdadeira
ou falsa, mas nunca como verdadeira e falsa ao mesmo tempo.

São proposições:

- "Brasília é a capital do Brasil." — pode ser classificada como verdadeira.
- "7 é um número par." — pode ser classificada como falsa.
- "A prova começa às oito horas." — será verdadeira ou falsa conforme os fatos.

Não são proposições:

- frases interrogativas: "Você estudou?";
- frases imperativas: "Resolva a questão.";
- frases exclamativas: "Que prova difícil!";
- frases sem valor lógico definido: "Este material é excelente." Sem contexto
  e critério objetivo, a frase pode expressar opinião.

Uma frase declarativa com variável aberta também não é proposição enquanto a
variável não for definida. "x + 2 = 5" não possui valor lógico único; para
`x = 3`, torna-se verdadeira.

## 2. Proposição simples e composta

Proposição **simples** não contém outra proposição ligada por conectivo lógico.
Pode ser representada por uma letra:

> p: O aluno revisou o conteúdo.

Proposição **composta** resulta da combinação de proposições simples:

> p: O aluno revisou o conteúdo.  
> q: O aluno resolveu questões.  
> p e q: O aluno revisou o conteúdo e resolveu questões.

As letras `p`, `q`, `r` representam proposições. Os símbolos mais usados são:

| Símbolo | Nome | Leitura |
|---|---|---|
| `¬p` | negação | não p |
| `p ∧ q` | conjunção | p e q |
| `p ∨ q` | disjunção inclusiva | p ou q |
| `p ⊻ q` | disjunção exclusiva | ou p ou q, mas não ambos |
| `p → q` | condicional | se p, então q |
| `p ↔ q` | bicondicional | p se e somente se q |

## 3. Negação

A negação inverte o valor lógico da proposição. Se `p` é verdadeira, `¬p` é
falsa; se `p` é falsa, `¬p` é verdadeira.

Na linguagem comum, a negação de "O candidato foi aprovado" é "O candidato
não foi aprovado". Para uma frase com quantificador, cuidado:

- negação de "todos estudaram" = "pelo menos um não estudou";
- negação de "algum estudou" = "nenhum estudou";
- negação de "nenhum estudou" = "algum estudou".

Não se deve negar "todos" apenas trocando por "nenhum". Basta um contraexemplo
para negar uma afirmação universal.

## 4. Conjunção: `p ∧ q`

A conjunção é verdadeira somente quando as duas proposições são verdadeiras.

| p | q | p ∧ q |
|---|---|---|
| V | V | V |
| V | F | F |
| F | V | F |
| F | F | F |

Na frase "O candidato estudou Direito Constitucional e Direito Administrativo",
as duas informações precisam ser verdadeiras.

A negação da conjunção segue a primeira lei de De Morgan:

`¬(p ∧ q) ↔ (¬p ∨ ¬q)`

Em palavras: não é verdade que p e q equivale a p não ocorrer ou q não
ocorrer. Exemplo: "Não é verdade que Ana estudou Português e Matemática"
equivale a "Ana não estudou Português ou Ana não estudou Matemática".

## 5. Disjunção inclusiva: `p ∨ q`

O "ou" inclusivo é falso somente quando as duas proposições são falsas.

| p | q | p ∨ q |
|---|---|---|
| V | V | V |
| V | F | V |
| F | V | V |
| F | F | F |

Em uma questão, "o candidato estudará Português ou Raciocínio Lógico" pode
permitir que ele estude os dois, salvo se o contexto indicar exclusividade.

A negação segue a segunda lei de De Morgan:

`¬(p ∨ q) ↔ (¬p ∧ ¬q)`

## 6. Disjunção exclusiva: `p ⊻ q`

A disjunção exclusiva é verdadeira quando exatamente uma proposição é
verdadeira. Se as duas forem verdadeiras, o resultado é falso.

| p | q | p ⊻ q |
|---|---|---|
| V | V | F |
| V | F | V |
| F | V | V |
| F | F | F |

Expressões como "ou... ou...", "mas não ambos" e "exatamente uma das duas"
normalmente indicam exclusividade.

## 7. Condicional: `p → q`

Lê-se "se p, então q". A primeira proposição é o **antecedente** e a segunda
é o **consequente**. O condicional só é falso quando o antecedente é verdadeiro
e o consequente é falso.

| p | q | p → q |
|---|---|---|
| V | V | V |
| V | F | F |
| F | V | V |
| F | F | V |

Exemplo: "Se o candidato estuda, então resolve questões" só é desmentida por
um caso em que o candidato estuda e não resolve questões.

A equivalência fundamental é:

`p → q ↔ ¬p ∨ q`

A **contrapositiva** também é equivalente:

`p → q ↔ ¬q → ¬p`

Portanto, "Se estudo, então melhoro" equivale a "Se não melhoro, então não
estudo". Atenção: a conversa e a inversa não são equivalentes:

- conversa: `q → p`;
- inversa: `¬p → ¬q`.

## 8. Bicondicional: `p ↔ q`

Lê-se "p se e somente se q". É verdadeira quando as duas proposições têm o
mesmo valor lógico.

| p | q | p ↔ q |
|---|---|---|
| V | V | V |
| V | F | F |
| F | V | F |
| F | F | V |

O bicondicional equivale a dois condicionais simultâneos:

`p ↔ q ↔ (p → q) ∧ (q → p)`

Ele expressa condição necessária e suficiente. Se "ser aprovado é condição
necessária e suficiente para receber o certificado", aprovação implica
certificado e certificado implica aprovação.

## 9. Tabela-verdade

Se uma proposição composta possui `n` proposições simples distintas, a tabela
terá `2^n` linhas.

- 1 proposição simples: `2^1 = 2` linhas;
- 2 proposições simples: `2^2 = 4` linhas;
- 3 proposições simples: `2^3 = 8` linhas;
- 4 proposições simples: `2^4 = 16` linhas.

Conte proposições simples distintas, não o número de letras que aparecem.
Em `p ∨ p`, existe apenas uma proposição simples: a tabela tem 2 linhas.

# Como a banca cobra

- Frase interrogativa ou imperativa não é proposição.
- "Ou" normalmente é inclusivo, salvo indicação de exclusividade.
- Condicional só é falso em `V → F`.
- A contrapositiva preserva equivalência; conversa e inversa, não.
- A negação de "e" vira "ou"; a negação de "ou" vira "e".
- A negação de "todos" é "pelo menos um não".
- O número de linhas é `2^n`, considerando proposições simples distintas.

# Exemplos resolvidos

## Exemplo 1

Classifique: "Estude ou resolva questões, mas não faça as duas atividades."

O trecho "mas não faça as duas" indica disjunção exclusiva. Se `p` é estudar
e `q` é resolver questões, a forma é `p ⊻ q`.

## Exemplo 2

Qual é a negação de "Se o sistema funciona, então o relatório é emitido"?

Para negar um condicional, mantenha o antecedente e negue o consequente:

`¬(p → q) ↔ p ∧ ¬q`

Resposta: "O sistema funciona e o relatório não é emitido."

# Quadro-resumo

| Estrutura | Quando é falsa? |
|---|---|
| `¬p` | quando p é verdadeira |
| `p ∧ q` | quando pelo menos uma é falsa |
| `p ∨ q` | quando as duas são falsas |
| `p ⊻ q` | quando as duas têm o mesmo valor |
| `p → q` | somente quando p é V e q é F |
| `p ↔ q` | quando p e q têm valores diferentes |

| Negação | Equivalência |
|---|---|
| `¬(p ∧ q)` | `¬p ∨ ¬q` |
| `¬(p ∨ q)` | `¬p ∧ ¬q` |
| `¬(p → q)` | `p ∧ ¬q` |
| `p → q` | `¬p ∨ q` |
| `p → q` | `¬q → ¬p` |

# Questões de fixação

## Questão 1 — (questão inédita)

Assinale a frase que é uma proposição lógica.

A) Estude mais para a prova!  
B) Qual é o horário da prova?  
C) Brasília é a capital do Brasil.  
D) Que excelente resultado!  
E) x + 1 = 4.

**Gabarito: C.** É frase declarativa com valor lógico definido. A alternativa
E possui variável aberta e não determina um único valor lógico.

## Questão 2 — (questão inédita)

O valor de `p → q` é falso quando:

A) p é falsa e q é falsa.  
B) p é falsa e q é verdadeira.  
C) p é verdadeira e q é falsa.  
D) p e q são verdadeiras.  
E) p e q têm o mesmo valor.

**Gabarito: C.** O condicional só é falso quando o antecedente é verdadeiro e o
consequente é falso.

## Questão 3 — (questão inédita)

A negação de "O candidato estudou Direito Constitucional e Direito
Administrativo" é:

A) O candidato não estudou nenhuma das duas matérias.  
B) O candidato estudou uma das duas matérias.  
C) O candidato não estudou Direito Constitucional ou não estudou Direito Administrativo.  
D) O candidato estudou Direito Constitucional e não estudou Administrativo.  
E) O candidato estudou Direito Administrativo ou as duas matérias.

**Gabarito: C.** Pela lei de De Morgan, a negação de `p ∧ q` é `¬p ∨ ¬q`.

## Questão 4 — (questão inédita)

Uma tabela-verdade de uma proposição composta com três proposições simples
distintas possui:

A) 3 linhas. B) 6 linhas. C) 8 linhas. D) 9 linhas. E) 12 linhas.

**Gabarito: C.** O total é `2^3 = 8` linhas.

## Questão 5 — (questão inédita)

A proposição `p → q` é logicamente equivalente a:

A) `p ∧ q`. B) `p ∨ q`. C) `¬p ∧ q`. D) `¬p ∨ q`. E) `p ↔ q`.

**Gabarito: D.** Essa é a equivalência fundamental do condicional:
`p → q ↔ ¬p ∨ q`.

# Revisão final

- [ ] Sei identificar uma proposição.
- [ ] Diferencio proposição simples de composta.
- [ ] Sei as condições de falsidade dos seis conectivos principais.
- [ ] Sei negar conjunção, disjunção e condicional.
- [ ] Lembro que o condicional só é falso em `V → F`.
- [ ] Sei usar a contrapositiva.
- [ ] Diferencio "ou" inclusivo de exclusivo.
- [ ] Calculo tabelas com `2^n` linhas.
