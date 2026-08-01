-- ============================================================
-- MATRIZ APROVA — Migração 009
-- Corrige escalada de privilégio para admin via RLS.
--
-- As policies de UPDATE/INSERT da tabela `profiles` só checavam
-- `auth.uid() = id`. Como o PostgreSQL reutiliza o USING como
-- WITH CHECK quando este não é informado, qualquer usuário podia
-- rodar `UPDATE profiles SET role = 'admin'` no próprio perfil
-- e virar admin.
--
-- A correção restringe role e suspenso no WITH CHECK: o usuário
-- só consegue manter o próprio perfil como `role = 'user'`.
-- Admins continuam editando qualquer perfil pela policy
-- `is_admin()` (que é OR'd, então não é afetada).
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

DROP POLICY IF EXISTS "Usuário edita apenas seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita apenas seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user' AND suspenso = false);

DROP POLICY IF EXISTS "Sistema pode inserir perfil" ON public.profiles;
CREATE POLICY "Sistema pode inserir perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user' AND suspenso = false);
