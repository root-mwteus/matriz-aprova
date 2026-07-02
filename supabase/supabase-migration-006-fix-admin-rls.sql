-- ============================================================
-- MATRIZ APROVA — Migração 006
-- Conserta o acesso ao /admin de uma vez só:
--   1. Garante a coluna `suspenso` (lida pelo middleware).
--   2. Substitui as policies admin AUTO-REFERENTES da tabela
--      `profiles` por uma função SECURITY DEFINER `is_admin()`,
--      eliminando o erro "infinite recursion detected in policy
--      for relation profiles".
--
-- Idempotente: pode rodar mais de uma vez. Roda no SQL Editor
-- do Supabase. Substitui as policies criadas na migração 001.
-- ============================================================

-- 1. Coluna de suspensão (caso a migração 001 não tenha rodado)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspenso boolean NOT NULL DEFAULT false;

-- 2. Função que checa se o usuário atual é admin.
--    SECURITY DEFINER faz a função rodar como o dono (que ignora
--    RLS), então o SELECT em profiles NÃO re-dispara as policies
--    de profiles — sem recursão.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Recria as policies admin de profiles usando a função
--    (substitui as versões auto-referentes da migração 001).
DROP POLICY IF EXISTS "Admin vê todos os perfis" ON public.profiles;
CREATE POLICY "Admin vê todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin atualiza qualquer perfil" ON public.profiles;
CREATE POLICY "Admin atualiza qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());
