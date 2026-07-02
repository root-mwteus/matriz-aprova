-- ============================================================
-- MATRIZ APROVA — Migração 003
-- Campos que faltavam para o admin de Cursos e Materiais
-- funcionarem de verdade, além do bucket de Storage usado pelo
-- upload de PDFs.
--
-- IMPORTANTE: rode este script no SQL Editor do Supabase do
-- projeto em produção/staging. Ele é idempotente (pode ser
-- rodado mais de uma vez sem efeitos colaterais).
-- ============================================================

-- 1. Courses precisa de um campo de publicação (rascunho vs publicado)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS publicado boolean NOT NULL DEFAULT false;

-- 2. Materials precisa de submatéria e flag de recomendação por IA
--    (já previstos no tipo AdminMaterial e na tela /admin/materiais,
--    mas ausentes do schema original)
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS sub_materia text,
  ADD COLUMN IF NOT EXISTS ia_recommend boolean NOT NULL DEFAULT false;

-- 3. Bucket de Storage para os PDFs de materiais.
--    Privado: o acesso de leitura é feito via signed URL gerada
--    no servidor/client autenticado, nunca por URL pública direta.
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais', 'materiais', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admin faz upload de materiais" ON storage.objects;
CREATE POLICY "Admin faz upload de materiais"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin atualiza materiais no storage" ON storage.objects;
CREATE POLICY "Admin atualiza materiais no storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin exclui materiais do storage" ON storage.objects;
CREATE POLICY "Admin exclui materiais do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'materiais'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Autenticados leem materiais do storage" ON storage.objects;
CREATE POLICY "Autenticados leem materiais do storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materiais' AND auth.role() = 'authenticated');
