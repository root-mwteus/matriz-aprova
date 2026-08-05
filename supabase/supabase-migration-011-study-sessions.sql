-- ============================================================
-- MATRIZ APROVA — Migração 011
-- Sessões de estudo do cronômetro.
--
-- Cada sessão salva pelo cronômetro vira uma linha aqui, o que
-- permite recompor "hoje" e totalizar minutos por dia/matéria.
--
-- RLS: cada usuário vê, insere e exclui apenas as próprias
-- sessões.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia        text NOT NULL,
  tempo_minutos  integer NOT NULL CHECK (tempo_minutos > 0),
  registrado_em  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê apenas suas próprias sessões" ON public.study_sessions;
CREATE POLICY "Usuário vê apenas suas próprias sessões"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere apenas suas próprias sessões" ON public.study_sessions;
CREATE POLICY "Usuário insere apenas suas próprias sessões"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário exclui apenas suas próprias sessões" ON public.study_sessions;
CREATE POLICY "Usuário exclui apenas suas próprias sessões"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user          ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_registrado_em ON public.study_sessions(registrado_em);
