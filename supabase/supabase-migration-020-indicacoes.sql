-- ============================================================
-- MATRIZ APROVA — Migração 020
-- Programa de indicações (desconto para o indicado).
--
-- `profiles.codigo_indicacao`: código curto único por usuário
-- (gerado por trigger). O link de indicação é
-- /cadastro?ref=CODIGO — quem cria a conta com o código ganha o
-- desconto no vitalício, aplicado no checkout.
--
-- `indicacoes` liga indicador → indicado. Inserção só via service
-- (a rota /api/indicacoes valida: código existe, não é a própria
-- conta, uma indicação por vida de conta). `usada` marca que o
-- desconto já foi consumido num pagamento aprovado (webhook).
--
-- `config_pagamentos.desconto_indicacao_pct`: % editável no admin.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

-- 1. Código de indicação em profiles (trigger gera; backfill para quem já existe)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'codigo_indicacao'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN codigo_indicacao text UNIQUE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.gerar_codigo_indicacao()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  alfabeto text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  codigo text;
BEGIN
  LOOP
    codigo := '';
    FOR i IN 1..8 LOOP
      codigo := codigo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE codigo_indicacao = codigo);
  END LOOP;
  RETURN codigo;
END $$;

CREATE OR REPLACE FUNCTION public.handle_codigo_indicacao()
RETURNS trigger
AS $$
BEGIN
  IF NEW.codigo_indicacao IS NULL THEN
    NEW.codigo_indicacao := public.gerar_codigo_indicacao();
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_codigo_indicacao ON public.profiles;
CREATE TRIGGER on_profile_codigo_indicacao
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_codigo_indicacao();

-- Quem já tinha conta antes do trigger ganha código agora.
UPDATE public.profiles
SET codigo_indicacao = public.gerar_codigo_indicacao()
WHERE codigo_indicacao IS NULL;

-- 2. Tabela de indicações

CREATE TABLE IF NOT EXISTS public.indicacoes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  indicado_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','usada')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  usada_em     timestamptz,
  UNIQUE (indicado_id)
);

ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

-- Leitura: indicador vê as próprias indicações; indicado vê a própria.
DROP POLICY IF EXISTS "Leitura das próprias indicações" ON public.indicacoes;
CREATE POLICY "Leitura das próprias indicações"
  ON public.indicacoes FOR SELECT TO authenticated
  USING (auth.uid() = indicador_id OR auth.uid() = indicado_id);

CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON public.indicacoes(indicador_id);

-- 3. % de desconto editável no admin

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'config_pagamentos'
      AND column_name = 'desconto_indicacao_pct'
  ) THEN
    ALTER TABLE public.config_pagamentos ADD COLUMN desconto_indicacao_pct integer NOT NULL DEFAULT 10;
  END IF;
END $$;
