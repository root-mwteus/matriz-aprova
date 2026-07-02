-- ============================================================
-- MATRIZ APROVA — Migração 004
-- Cria a tabela "editais": catálogo de concursos públicos
-- abertos, curado pelo admin e visível para todos os alunos.
--
-- IMPORTANTE: rode este script no SQL Editor do Supabase do
-- projeto em produção/staging.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.editais (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orgao              text NOT NULL,
  cargo              text,
  banca              text,
  area_concurso      text NOT NULL,
  vagas              integer,
  data_prova         date,
  data_inscricao_fim date,
  link               text,
  status             text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'encerrado', 'previsto')),
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.editais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editais visíveis para todos autenticados" ON public.editais;
CREATE POLICY "Editais visíveis para todos autenticados"
  ON public.editais FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Apenas admin gerencia editais" ON public.editais;
CREATE POLICY "Apenas admin gerencia editais"
  ON public.editais FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Apenas admin edita editais" ON public.editais;
CREATE POLICY "Apenas admin edita editais"
  ON public.editais FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Apenas admin exclui editais" ON public.editais;
CREATE POLICY "Apenas admin exclui editais"
  ON public.editais FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_editais_area_concurso ON public.editais(area_concurso);
CREATE INDEX IF NOT EXISTS idx_editais_status ON public.editais(status);
