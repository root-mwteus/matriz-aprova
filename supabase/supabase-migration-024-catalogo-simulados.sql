INSERT INTO public.simulados_catalogo
  (slug, titulo, area, prova, quantidade, duracao_min, descricao)
VALUES
  ('concursos-gerais-01-base', 'Concursos Gerais 01 — Base Nacional', 'concursos-gerais', 'prova objetiva geral', 50, 180, 'Português, Direito Constitucional, Direito Administrativo, Raciocínio Lógico e Informática.'),
  ('concursos-gerais-02-policiais', 'Concursos Gerais 02 — Carreiras Policiais', 'concursos-gerais', 'prova objetiva policial', 50, 180, 'Base comum com Penal, Processo Penal, Direitos Humanos e legislação.'),
  ('concursos-gerais-03-fiscal', 'Concursos Gerais 03 — Fiscal e Controle', 'concursos-gerais', 'prova objetiva fiscal', 50, 180, 'Base comum com Tributário, Contabilidade, Auditoria e Estatística.'),
  ('concursos-gerais-04-tribunais', 'Concursos Gerais 04 — Tribunais', 'concursos-gerais', 'prova objetiva de tribunal', 50, 180, 'Português, Constitucional, Administrativo, Trabalho e Processo do Trabalho.'),
  ('concursos-gerais-05-inss', 'Concursos Gerais 05 — Previdenciário', 'concursos-gerais', 'prova objetiva previdenciária', 50, 180, 'Base comum com Direito Previdenciário e seguridade social.'),
  ('concursos-gerais-06-misto', 'Concursos Gerais 06 — Revisão Mista', 'concursos-gerais', 'prova objetiva mista', 50, 180, 'Revisão cumulativa dos principais temas do acervo.'),
  ('oab-01-constitucional-administrativo', 'OAB 01 — Constitucional e Administrativo', 'oab', '1ª fase FGV', 80, 300, 'Caderno completo de revisão com foco nas disciplinas públicas.'),
  ('oab-02-civil-processual', 'OAB 02 — Civil e Processo Civil', 'oab', '1ª fase FGV', 80, 300, 'Caderno completo de Direito Civil e Processo Civil.'),
  ('oab-03-penal-trabalho', 'OAB 03 — Penal e Trabalho', 'oab', '1ª fase FGV', 80, 300, 'Caderno completo de Direito Penal, Processo Penal e Trabalho.'),
  ('oab-04-etica-estatuto', 'OAB 04 — Ética e Estatuto', 'oab', '1ª fase FGV', 80, 300, 'Caderno com prioridade para Ética, Estatuto e disciplinas de alta incidência.'),
  ('oab-05-tributario-empresarial', 'OAB 05 — Tributário e Empresarial', 'oab', '1ª fase FGV', 80, 300, 'Caderno completo de Tributário, Empresarial e matérias correlatas.'),
  ('oab-06-revisao-geral', 'OAB 06 — Revisão Geral', 'oab', '1ª fase FGV', 80, 300, 'Revisão cumulativa de todas as disciplinas da 1ª fase.'),
  ('militares-01-esa', 'Militares 01 — ESA', 'militares', 'ESA', 50, 240, 'Português, Matemática, História, Geografia e conhecimentos militares.'),
  ('militares-02-espcex', 'Militares 02 — EsPCEx', 'militares', 'EsPCEx', 50, 240, 'Português, Matemática, História, Geografia e Ciências da Natureza.'),
  ('militares-03-eear', 'Militares 03 — EEAR', 'militares', 'EEAR', 50, 240, 'Português, Matemática, Física e conhecimentos específicos.'),
  ('militares-04-afa', 'Militares 04 — AFA', 'militares', 'AFA', 50, 240, 'Português, Matemática, Física, Química e Inglês.'),
  ('militares-05-ita-ime', 'Militares 05 — ITA e IME', 'militares', 'ITA/IME', 50, 300, 'Matemática, Física, Química e Português em nível avançado.'),
  ('militares-06-naval-efomm', 'Militares 06 — Naval e EFOMM', 'militares', 'Escola Naval/EFOMM', 50, 240, 'Português, Matemática, Física, Química e Inglês.'),
  ('enem-01-linguagens-humanas', 'ENEM 01 — Linguagens e Humanas', 'enem', 'ENEM 1º dia', 90, 330, 'Linguagens, Códigos, Ciências Humanas e produção textual em revisão.'),
  ('enem-02-natureza-matematica', 'ENEM 02 — Natureza e Matemática', 'enem', 'ENEM 2º dia', 90, 330, 'Ciências da Natureza e Matemática, com leitura de gráficos e situações-problema.'),
  ('enem-03-misto-competencias', 'ENEM 03 — Competências Mistas', 'enem', 'ENEM completo', 90, 330, 'Questões integradas por competências e habilidades.'),
  ('enem-04-humanas-linguagens', 'ENEM 04 — Humanas e Linguagens', 'enem', 'ENEM 1º dia', 90, 330, 'Revisão de interpretação, História, Geografia, Filosofia e Sociologia.'),
  ('enem-05-matematica-natureza', 'ENEM 05 — Matemática e Natureza', 'enem', 'ENEM 2º dia', 90, 330, 'Revisão de Matemática, Física, Química e Biologia.'),
  ('enem-06-revisao-geral', 'ENEM 06 — Revisão Geral', 'enem', 'ENEM completo', 90, 330, 'Caderno final de revisão das quatro áreas do exame.')
ON CONFLICT (slug) DO NOTHING;
