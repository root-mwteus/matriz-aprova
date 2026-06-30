-- Migration 005: bucket temporário para PDFs de provas (extrator de questões)
-- Execute no SQL Editor do Supabase

-- Bucket privado: admin faz upload, ninguém lê publicamente.
-- Os PDFs são temporários — descartados após a extração.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('pdf-provas', 'pdf-provas', false)
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin faz upload de pdf-provas'
  ) THEN
    CREATE POLICY "Admin faz upload de pdf-provas"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'pdf-provas'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin lê pdf-provas'
  ) THEN
    CREATE POLICY "Admin lê pdf-provas"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'pdf-provas'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admin exclui pdf-provas'
  ) THEN
    CREATE POLICY "Admin exclui pdf-provas"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'pdf-provas'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      );
  END IF;
END $$;
