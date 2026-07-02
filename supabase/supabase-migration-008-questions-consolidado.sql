-- ============================================================
-- MATRIZ APROVA — Migração 008 (CONSOLIDADA)
-- Garante TODAS as colunas que a tabela `questions` precisa,
-- juntando o que estava espalhado nas migrações 002/004/007.
-- Resolve o erro:
--   "Could not find the 'area_concurso' column of 'questions'"
--
-- Idempotente: pode rodar quantas vezes quiser. Rode no SQL
-- Editor do Supabase. Substitui a necessidade de rodar 002/004/007
-- separadamente.
-- ============================================================

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS sub_materia      text,
  ADD COLUMN IF NOT EXISTS area_concurso    text,
  ADD COLUMN IF NOT EXISTS referencias      text,
  ADD COLUMN IF NOT EXISTS figuras          jsonb   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS texto_referencia text,
  ADD COLUMN IF NOT EXISTS mostrar_texto    boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_questions_area_concurso ON public.questions(area_concurso);

-- Bucket público para figuras de questões (conteúdo educacional)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('questoes-figuras', 'questoes-figuras', true)
  ON CONFLICT (id) DO NOTHING;

-- Policies de storage do bucket de figuras (admin grava/exclui)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin faz upload de figuras de questoes'
  ) THEN
    CREATE POLICY "Admin faz upload de figuras de questoes"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'questoes-figuras'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin exclui figuras de questoes'
  ) THEN
    CREATE POLICY "Admin exclui figuras de questoes"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'questoes-figuras'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

-- Força o PostgREST a recarregar o cache de schema (senão o erro
-- "schema cache" pode persistir por alguns segundos).
NOTIFY pgrst, 'reload schema';
