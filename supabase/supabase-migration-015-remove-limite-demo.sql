-- ============================================================
-- MATRIZ APROVA — Migração 015
-- Remove o limite diário de questões do plano demo.
--
--   A ideia de limite foi abandonada: questões e simulados ficam
--   liberados para todos, e o paywall passou a bloquear por seção
--   (não por contagem). A coluna `limite_questoes_demo` da tabela
--   `config_pagamentos` não é mais usada em lugar nenhum.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

ALTER TABLE public.config_pagamentos
  DROP COLUMN IF EXISTS limite_questoes_demo;
