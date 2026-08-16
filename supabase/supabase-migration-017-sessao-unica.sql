-- ============================================================
-- MATRIZ APROVA — Migração 017
-- Sessão única por conta (uma pessoa conectada por vez).
--
-- `user_sessions` guarda qual é a sessão ativa de cada usuário:
-- o claim `session_id` do access token, que é estável entre
-- renovações da mesma sessão e muda a cada novo login. No login,
-- a nova sessão sobrescreve a anterior (service role, via
-- /api/auth/sessao e o callback de auth). O middleware e as
-- rotas /api comparam o session_id do cookie com o registrado —
-- não casando, a sessão antiga é derrubada.
--
-- RLS: o usuário só LÊ a própria linha. A escrita é exclusiva da
-- service role — sem isso, um cliente poderia regravar o id de
-- uma sessão antiga e burlar o limite de uma sessão por conta.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas a própria linha (check de sessão única).
DROP POLICY IF EXISTS "Leitura da própria sessão" ON public.user_sessions;
CREATE POLICY "Leitura da própria sessão"
  ON public.user_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
