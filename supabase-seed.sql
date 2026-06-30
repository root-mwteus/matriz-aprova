-- ============================================================
-- MATRIZ APROVA — Seed de Dados de Exemplo
-- Execute no SQL Editor do Supabase
-- ============================================================

-- ── QUESTIONS (10 questões) ──────────────────────────────
INSERT INTO public.questions (materia, banca, ano, nivel, enunciado, alternativas, resposta_correta, explicacao, incidencia_pct) VALUES
(
  'Português',
  'CESPE/CEBRASPE',
  2023,
  'medio',
  'Assinale a opção em que o uso da crase está CORRETO.',
  '[
    {"letter": "A", "text": "Fui à praia ontem."},
    {"letter": "B", "text": "Ele se referiu aquele assunto."},
    {"letter": "C", "text": "Entreguei o documento à ela."},
    {"letter": "D", "text": "Voltei à casa cedo."},
    {"letter": "E", "text": "Comprei à vista."}
  ]'::jsonb,
  0,
  'Na alternativa A, "à praia" exige crase por ser locução adverbial feminina. Nas demais, o uso é incorreto: "aquele" exige apenas preposição (a), "ela" é pronome pessoal que não admite crase, "casa" sem especificador não leva crase, e "à vista" é locução adverbial feminina que admite crase, mas a questão pede a correta.',
  85.50
),
(
  'Matemática',
  'FGV',
  2023,
  'facil',
  'Um investimento de R$ 1.000,00 rende juros simples de 2% ao mês. Após 6 meses, qual o montante?',
  '[
    {"letter": "A", "text": "R$ 1.100,00"},
    {"letter": "B", "text": "R$ 1.120,00"},
    {"letter": "C", "text": "R$ 1.200,00"},
    {"letter": "D", "text": "R$ 1.020,00"},
    {"letter": "E", "text": "R$ 1.012,00"}
  ]'::jsonb,
  1,
  'Juros simples: J = C × i × t = 1000 × 0,02 × 6 = 120. Montante = C + J = 1000 + 120 = R$ 1.120,00.',
  72.00
),
(
  'Direito Constitucional',
  'CESPE/CEBRASPE',
  2024,
  'medio',
  'São direitos fundamentais previstos na Constituição Federal de 1988, EXCETO:',
  '[
    {"letter": "A", "text": "Direito à vida"},
    {"letter": "B", "text": "Direito à liberdade de expressão"},
    {"letter": "C", "text": "Direito à dupla nacionalidade originária"},
    {"letter": "D", "text": "Direito à propriedade privada"},
    {"letter": "E", "text": "Direito de herança"}
  ]'::jsonb,
  2,
  'A dupla nacionalidade originária não é um direito fundamental em si, mas uma hipótese prevista no art. 12 da CF. Os direitos fundamentais estão elencados principalmente no art. 5º.',
  91.00
),
(
  'Direito Administrativo',
  'VUNESP',
  2023,
  'dificil',
  'Nos termos da Lei de Licitações (Lei 14.133/2021), é modalidade de licitação:',
  '[
    {"letter": "A", "text": "Tomada de preços"},
    {"letter": "B", "text": "Concurso"},
    {"letter": "C", "text": "Convite"},
    {"letter": "D", "text": "Carta-convite"},
    {"letter": "E", "text": "Leilão eletrônico"}
  ]'::jsonb,
  1,
  'A Lei 14.133/2021 prevê como modalidades: pregão, concorrência, concurso, leilão e diálogo competitivo. "Tomada de preços", "convite" e "carta-convite" eram modalidades da lei anterior (8.666/93).',
  68.00
),
(
  'Informática',
  'CESPE/CEBRASPE',
  2024,
  'facil',
  'No Microsoft Excel, a função que retorna o maior valor de um intervalo de células é:',
  '[
    {"letter": "A", "text": "=MAIOR()"},
    {"letter": "B", "text": "=MAX()"},
    {"letter": "C", "text": "=SUPERIOR()"},
    {"letter": "D", "text": "=TOP()"},
    {"letter": "E", "text": "=HIGH()"}
  ]'::jsonb,
  1,
  'A função =MAX() retorna o maior valor numérico de um intervalo. =MAIOR() existe mas retorna o k-ésimo maior valor.',
  95.00
),
(
  'Raciocínio Lógico',
  'FCC',
  2022,
  'medio',
  'Se todo concurseiro estuda e alguns estudantes são concurseiros, então:',
  '[
    {"letter": "A", "text": "Todos os estudantes estudam"},
    {"letter": "B", "text": "Alguns estudantes estudam"},
    {"letter": "C", "text": "Nenhum concurseiro é estudante"},
    {"letter": "D", "text": "Todo concurseiro é estudante"},
    {"letter": "E", "text": "Alguns concurseiros não estudam"}
  ]'::jsonb,
  1,
  'Premissas: (1) Todo concurseiro estuda. (2) Alguns estudantes são concurseiros. Conclusão válida: alguns estudantes são concurseiros e, como todo concurseiro estuda, então alguns estudantes estudam.',
  77.50
),
(
  'Direito Constitucional',
  'FGV',
  2023,
  'dificil',
  'Acerca do controle de constitucionalidade no Brasil, assinale a alternativa CORRETA:',
  '[
    {"letter": "A", "text": "O STF só pode declarar inconstitucionalidade por maioria absoluta"},
    {"letter": "B", "text": "A ADI pode ser proposta por qualquer cidadão"},
    {"letter": "C", "text": "A decisão em ADC tem efeito vinculante"},
    {"letter": "D", "text": "O controle difuso não é admitido no Brasil"},
    {"letter": "E", "text": "A arguição de descumprimento de preceito fundamental é prevista na CF"}
  ]'::jsonb,
  2,
  'A ADC (Ação Declaratória de Constitucionalidade) tem efeito vinculante e eficácia contra todos (art. 102, §2º, CF). A ADI exige legitimados específicos (art. 103).',
  82.00
),
(
  'Português',
  'VUNESP',
  2022,
  'medio',
  'Em "O livro que li é interessante", o termo "que" exerce função de:',
  '[
    {"letter": "A", "text": "Conjunção integrante"},
    {"letter": "B", "text": "Pronome relativo"},
    {"letter": "C", "text": "Conjunção causal"},
    {"letter": "D", "text": "Partícula expletiva"},
    {"letter": "E", "text": "Preposição"}
  ]'::jsonb,
  1,
  '"Que" retoma o termo anterior "livro" e exerce função de pronome relativo, equivalente a "o qual". Introduz oração adjetiva restritiva.',
  88.00
),
(
  'Matemática',
  'IBFC',
  2023,
  'facil',
  'Qual é a área de um círculo com raio de 5 cm? (considere π = 3,14)',
  '[
    {"letter": "A", "text": "78,5 cm²"},
    {"letter": "B", "text": "31,4 cm²"},
    {"letter": "C", "text": "15,7 cm²"},
    {"letter": "D", "text": "157 cm²"},
    {"letter": "E", "text": "62,8 cm²"}
  ]'::jsonb,
  0,
  'Área do círculo = π × r² = 3,14 × 25 = 78,5 cm².',
  70.00
),
(
  'Direito Administrativo',
  'CESPE/CEBRASPE',
  2024,
  'medio',
  'São princípios explícitos da Administração Pública no art. 37 da CF:',
  '[
    {"letter": "A", "text": "Legalidade, moralidade, eficiência e razoabilidade"},
    {"letter": "B", "text": "Legalidade, impessoalidade, moralidade e publicidade"},
    {"letter": "C", "text": "Impessoalidade, eficiência, proporcionalidade e legalidade"},
    {"letter": "D", "text": "Publicidade, moralidade, segurança jurídica e eficiência"},
    {"letter": "E", "text": "Legalidade, moralidade, finalidade e eficiência"}
  ]'::jsonb,
  1,
  'O caput do art. 37 da CF elenca cinco princípios explícitos: legalidade, impessoalidade, moralidade, publicidade e eficiência (LIMPE).',
  93.00
);

-- ── MATERIALS (5 materiais) ──────────────────────────────
INSERT INTO public.materials (titulo, materia, banca, professor, paginas, pdf_url, incidencia_pct) VALUES
('Gramática Completa para Concursos', 'Português', 'CESPE/CEBRASPE', 'Prof. Carlos Alberto', 180, 'gramatica-completa.pdf', 92.00),
('Direito Constitucional Esquematizado', 'Direito Constitucional', 'FGV', 'Prof. Ana Lúcia', 240, 'dc-esquematizado.pdf', 88.00),
('Matemática Básica para Concursos', 'Matemática', 'VUNESP', 'Prof. Ricardo Santos', 120, 'matematica-basica.pdf', 75.00),
('Lei de Licitações Comentada', 'Direito Administrativo', 'CESPE/CEBRASPE', 'Prof. João Pedro', 96, 'licitacoes-comentada.pdf', 82.00),
('Informática Passo a Passo', 'Informática', 'FGV', 'Prof. Marina Costa', 64, 'informatica-passo-a-passo.pdf', 70.00);

-- ── COURSES (3 cursos) ─────────────────────────────────
INSERT INTO public.courses (titulo, area, descricao, thumbnail_url, ordem) VALUES
('Pacote Completo para Concursos Jurídicos', 'Concursos Gerais', 'Curso completo com todas as disciplinas para concursos da área jurídica: Direito Constitucional, Administrativo, Penal, Civil e mais.', NULL, 1),
('Preparatório OAB', 'OAB', 'Prepare-se para o Exame da Ordem com questões comentadas e simulados nos moldes da FGV.', NULL, 2),
('Matemática e Raciocínio Lógico', 'Concursos Gerais', 'Curso focado em Matemática e Raciocínio Lógico para concursos públicos de todas as bancas.', NULL, 3);

-- ── MODULES e LESSONS para cada curso ───────────────────
DO $$
DECLARE
  v_curso_juridico_id uuid;
  v_curso_oab_id uuid;
  v_curso_matematica_id uuid;
BEGIN
  SELECT id INTO v_curso_juridico_id FROM public.courses WHERE titulo = 'Pacote Completo para Concursos Jurídicos' LIMIT 1;
  SELECT id INTO v_curso_oab_id FROM public.courses WHERE titulo = 'Preparatório OAB' LIMIT 1;
  SELECT id INTO v_curso_matematica_id FROM public.courses WHERE titulo = 'Matemática e Raciocínio Lógico' LIMIT 1;

  -- Módulos - Curso Jurídico
  INSERT INTO public.modules (course_id, titulo, ordem) VALUES
    (v_curso_juridico_id, 'Direito Constitucional', 1),
    (v_curso_juridico_id, 'Direito Administrativo', 2),
    (v_curso_juridico_id, 'Português Jurídico', 3);

  -- Módulos - OAB
  INSERT INTO public.modules (course_id, titulo, ordem) VALUES
    (v_curso_oab_id, 'Ética Profissional', 1),
    (v_curso_oab_id, 'Direito Constitucional', 2),
    (v_curso_oab_id, 'Direito Civil', 3);

  -- Módulos - Matemática
  INSERT INTO public.modules (course_id, titulo, ordem) VALUES
    (v_curso_matematica_id, 'Matemática Básica', 1),
    (v_curso_matematica_id, 'Raciocínio Lógico', 2);
END $$;
