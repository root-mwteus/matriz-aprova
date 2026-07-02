-- ============================================================
-- MATRIZ APROVA — Migração 001
-- Permite que admins vejam/editem qualquer perfil e adiciona
-- suporte real a suspensão de conta.
--
-- IMPORTANTE: rode este script no SQL Editor do Supabase do
-- projeto em produção/staging. Ele é idempotente (pode ser
-- rodado mais de uma vez sem efeitos colaterais).
-- ============================================================

-- 1. Campo de suspensão de conta
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspenso boolean NOT NULL DEFAULT false;

-- 2. Hoje só existem policies de "vê/edita apenas o próprio perfil".
--    Sem isso, o painel admin não consegue listar nem suspender
--    outros usuários (RLS bloqueia silenciosamente).
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON public.profiles;
CREATE POLICY "Admin vê todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin atualiza qualquer perfil" ON public.profiles;
CREATE POLICY "Admin atualiza qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
