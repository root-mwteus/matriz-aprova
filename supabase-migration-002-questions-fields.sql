-- ============================================================
-- MATRIZ APROVA — Migração 002
-- Adiciona campos de classificação à tabela questions, já
-- previstos no formulário do admin (nova questão) e no tipo
-- AdminQuestao, mas ausentes do schema original.
--
-- IMPORTANTE: rode este script no SQL Editor do Supabase do
-- projeto em produção/staging. Ele é idempotente (pode ser
-- rodado mais de uma vez sem efeitos colaterais).
-- ============================================================

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS sub_materia text,
  ADD COLUMN IF NOT EXISTS area_concurso text;

CREATE INDEX IF NOT EXISTS idx_questions_area_concurso ON public.questions(area_concurso);
