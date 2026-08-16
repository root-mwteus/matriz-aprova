-- ============================================================
-- MATRIZ APROVA — Migração 022
-- Plano de estudos por semanas com liberação progressiva.
--
-- Substitui o uso de `study_plans` (uma semana única em jsonb) por
-- duas tabelas: `planos_estudo` guarda um plano por concurso-alvo
-- (com data da prova e carga diária), e `plano_semanas` guarda uma
-- linha por semana, cada uma com suas tarefas em jsonb e flag de
-- conclusão. O usuário só edita a semana liberada
-- (`planos_estudo.semana_liberada`); as demais aparecem com cadeado.
--
-- A liberação é progressiva e acontece no servidor (rota
-- /api/plano/desbloquear-semana): a próxima semana abre quando a
-- atual está 100% concluída OU quando a data da semana já passou
-- (ninguém fica preso por ter perdido o ritmo).
--
-- `profiles.concurso_alvo`: nome do concurso escolhido no onboarding
-- (liga o perfil ao plano; o onboarding também preenche isso).
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

-- 1. Coluna de concurso-alvo em profiles

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'concurso_alvo'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN concurso_alvo text;
  END IF;
END $$;

-- 2. Planos de estudo (um por concurso-alvo)

CREATE TABLE IF NOT EXISTS public.planos_estudo (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concurso       text NOT NULL,
  area_concurso  text NOT NULL DEFAULT 'Concursos Gerais',
  data_prova     date NOT NULL,
  horas_por_dia  integer NOT NULL DEFAULT 4 CHECK (horas_por_dia BETWEEN 1 AND 16),
  semanas_total  integer NOT NULL CHECK (semanas_total BETWEEN 1 AND 52),
  semana_liberada integer NOT NULL DEFAULT 1 CHECK (semana_liberada >= 1),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_estudo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê apenas seus próprios planos de estudo" ON public.planos_estudo;
CREATE POLICY "Usuário vê apenas seus próprios planos de estudo"
  ON public.planos_estudo FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere apenas seus próprios planos de estudo" ON public.planos_estudo;
CREATE POLICY "Usuário insere apenas seus próprios planos de estudo"
  ON public.planos_estudo FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário atualiza apenas seus próprios planos de estudo" ON public.planos_estudo;
CREATE POLICY "Usuário atualiza apenas seus próprios planos de estudo"
  ON public.planos_estudo FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário exclui apenas seus próprios planos de estudo" ON public.planos_estudo;
CREATE POLICY "Usuário exclui apenas seus próprios planos de estudo"
  ON public.planos_estudo FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_planos_estudo_user ON public.planos_estudo(user_id, created_at DESC);

-- 3. Semanas do plano (uma linha por semana)

CREATE TABLE IF NOT EXISTS public.plano_semanas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id      uuid NOT NULL REFERENCES public.planos_estudo(id) ON DELETE CASCADE,
  numero        integer NOT NULL CHECK (numero >= 1),
  semana_inicio date NOT NULL,
  foco          text NOT NULL DEFAULT '',
  tarefas       jsonb NOT NULL DEFAULT '[]'::jsonb,
  concluido     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plano_id, numero)
);

ALTER TABLE public.plano_semanas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê semanas dos próprios planos" ON public.plano_semanas;
CREATE POLICY "Usuário vê semanas dos próprios planos"
  ON public.plano_semanas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planos_estudo pe WHERE pe.id = plano_id AND pe.user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuário insere semanas nos próprios planos" ON public.plano_semanas;
CREATE POLICY "Usuário insere semanas nos próprios planos"
  ON public.plano_semanas FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.planos_estudo pe WHERE pe.id = plano_id AND pe.user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuário atualiza semanas dos próprios planos" ON public.plano_semanas;
CREATE POLICY "Usuário atualiza semanas dos próprios planos"
  ON public.plano_semanas FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planos_estudo pe WHERE pe.id = plano_id AND pe.user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuário exclui semanas dos próprios planos" ON public.plano_semanas;
CREATE POLICY "Usuário exclui semanas dos próprios planos"
  ON public.plano_semanas FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.planos_estudo pe WHERE pe.id = plano_id AND pe.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_plano_semanas_plano ON public.plano_semanas(plano_id, numero);