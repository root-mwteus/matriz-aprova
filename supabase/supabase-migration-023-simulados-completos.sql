-- Catálogo de cadernos completos e vínculo ordenado com questões.
-- Questões públicas devem manter a referência da prova original;
-- questões inéditas devem ser identificadas explicitamente.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'inédita'
    CHECK (origem IN ('pública', 'inédita', 'adaptada'));

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS fonte_url text;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS codigo_importacao text UNIQUE;

CREATE TABLE IF NOT EXISTS public.simulados_catalogo (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  titulo          text NOT NULL,
  area            text NOT NULL,
  prova           text NOT NULL,
  quantidade      integer NOT NULL CHECK (quantidade IN (50, 80, 90)),
  duracao_min     integer NOT NULL CHECK (duracao_min > 0),
  descricao       text,
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.simulados_catalogo_questoes (
  simulado_id     uuid NOT NULL REFERENCES public.simulados_catalogo(id) ON DELETE CASCADE,
  question_id    uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  ordem           integer NOT NULL CHECK (ordem > 0),
  PRIMARY KEY (simulado_id, question_id),
  UNIQUE (simulado_id, ordem)
);

ALTER TABLE public.simulados_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados_catalogo_questoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cadernos ativos visíveis para autenticados"
  ON public.simulados_catalogo FOR SELECT
  USING (auth.role() = 'authenticated' AND ativo = true);

CREATE POLICY "Admin gerencia cadernos"
  ON public.simulados_catalogo FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Questões de cadernos visíveis para autenticados"
  ON public.simulados_catalogo_questoes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin gerencia questões de cadernos"
  ON public.simulados_catalogo_questoes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_simulados_catalogo_area
  ON public.simulados_catalogo(area, ativo);

CREATE INDEX IF NOT EXISTS idx_simulados_catalogo_questoes_ordem
  ON public.simulados_catalogo_questoes(simulado_id, ordem);
