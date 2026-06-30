-- Migration 004: LaTeX e figuras no banco de questões
-- Execute no SQL Editor do Supabase

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS figuras     jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS referencias text;

-- Bucket público para figuras de questões (conteúdo educacional, sem restrição de acesso)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('questoes-figuras', 'questoes-figuras', true)
  ON CONFLICT (id) DO NOTHING;

-- Admin pode fazer upload de figuras
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin pode upload de figuras de questoes'
  ) THEN
    CREATE POLICY "Admin pode upload de figuras de questoes"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'questoes-figuras'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin pode excluir figuras de questoes'
  ) THEN
    CREATE POLICY "Admin pode excluir figuras de questoes"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'questoes-figuras'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      );
  END IF;
END $$;
