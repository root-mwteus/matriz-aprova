-- 031: rastreabilidade de questões importadas de fontes públicas.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS fonte_id_original text,
  ADD COLUMN IF NOT EXISTS prova text,
  ADD COLUMN IF NOT EXISTS imagens_origem jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_questions_fonte_id_original
  ON public.questions(fonte_id_original)
  WHERE fonte_id_original IS NOT NULL;
