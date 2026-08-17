-- ============================================================
-- MATRIZ APROVA — Migração 027
-- Perfil público do usuário: ícone, banner, bio, prova alvo e
-- molduras de avatar desbloqueáveis.
--
-- IMPORTANTE: rode este script no SQL Editor do Supabase do
-- projeto em produção/staging. Ele é idempotente (pode ser
-- rodado mais de uma vez sem efeitos colaterais).
--
-- Molduras: PNG quadrado 512×512 com transparência, no bucket
-- público `molduras`, caminho `<slug>.png` (ex.: dourado.png).
-- O desbloqueio é um enum: 'livre' (qualquer plano) ou
-- 'vitalicio' (só assinantes do plano vitalício).
-- ============================================================

-- 1. Novos campos de perfil (a FK para molduras entra depois, na seção 2 —
--    o Postgres exige que a tabela referenciada já exista no momento do DDL).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS prova_alvo text,
  ADD COLUMN IF NOT EXISTS icone_path text,
  ADD COLUMN IF NOT EXISTS banner_path text;

-- 2. Tabela de molduras (catálogo de artefatos, admin gerencia)
CREATE TABLE IF NOT EXISTS public.molduras (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  nome        text NOT NULL,
  arquivo     text NOT NULL,
  desbloqueio text NOT NULL DEFAULT 'livre' CHECK (desbloqueio IN ('livre', 'vitalicio')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.molduras ENABLE ROW LEVEL SECURITY;

-- O RLS de profiles só expõe o próprio perfil; a lista de molduras
-- precisa ser legível por qualquer autenticado para renderizar os
-- avatares nos rankings, ligas e duelos.
DROP POLICY IF EXISTS "Autenticados leem molduras" ON public.molduras;
CREATE POLICY "Autenticados leem molduras"
  ON public.molduras FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin cria molduras" ON public.molduras;
CREATE POLICY "Admin cria molduras"
  ON public.molduras FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin atualiza molduras" ON public.molduras;
CREATE POLICY "Admin atualiza molduras"
  ON public.molduras FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin exclui molduras" ON public.molduras;
CREATE POLICY "Admin exclui molduras"
  ON public.molduras FOR DELETE
  USING (public.is_admin());

-- A FK do perfil aponta para a tabela que acabou de ser criada acima.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS moldura_id uuid REFERENCES public.molduras(id) ON DELETE SET NULL;

-- 3. Buckets públicos: ícones/banners de perfil e molduras
INSERT INTO storage.buckets (id, name, public)
VALUES ('perfis', 'perfis', true), ('molduras', 'molduras', true)
ON CONFLICT (id) DO NOTHING;

-- Cada usuário só mexe na própria pasta: perfis/<user_id>/...
DROP POLICY IF EXISTS "Perfil faz upload na própria pasta" ON storage.objects;
CREATE POLICY "Perfil faz upload na própria pasta"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'perfis' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Perfil atualiza a própria pasta" ON storage.objects;
CREATE POLICY "Perfil atualiza a própria pasta"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'perfis' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'perfis' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Perfil exclui da própria pasta" ON storage.objects;
CREATE POLICY "Perfil exclui da própria pasta"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'perfis' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Molduras no storage: só admin escreve.
DROP POLICY IF EXISTS "Admin envia molduras ao storage" ON storage.objects;
CREATE POLICY "Admin envia molduras ao storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'molduras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin atualiza molduras no storage" ON storage.objects;
CREATE POLICY "Admin atualiza molduras no storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'molduras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'molduras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin exclui molduras do storage" ON storage.objects;
CREATE POLICY "Admin exclui molduras do storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'molduras'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );