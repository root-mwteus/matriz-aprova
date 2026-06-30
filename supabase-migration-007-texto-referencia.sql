-- Migration 007: texto de referência (questões de linguagens/interpretação)
-- Execute no SQL Editor do Supabase

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS texto_referencia text,
  ADD COLUMN IF NOT EXISTS mostrar_texto boolean NOT NULL DEFAULT true;
