-- ============================================================
-- MATRIZ APROVA — Migração 013
-- Planos e pagamentos (Mercado Pago).
--
--   1. `profiles.plano` (demo | vitalicio) com default 'demo'.
--      O webhook do Mercado Pago (service_role) é quem promove
--      para 'vitalicio' após pagamento aprovado.
--   2. Tabela `pagamentos` registra cada cobrança (status da API
--      do MP) — o usuário vê os próprios, o admin vê todos.
--   3. Trigger anti-escalada: UPDATE de `profiles` vindo do
--      cliente autenticado NÃO pode mudar role, plano ou suspenso.
--      Só o servidor (service_role) ou o owner do banco podem.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

-- 1. Coluna de plano em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plano text NOT NULL DEFAULT 'demo'
  CHECK (plano IN ('demo', 'vitalicio'));

-- 2. Tabela de pagamentos
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_preference_id text,
  mp_payment_id    text UNIQUE,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  valor            integer NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário vê próprios pagamentos" ON public.pagamentos;
CREATE POLICY "Usuário vê próprios pagamentos"
  ON public.pagamentos FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin vê todos os pagamentos" ON public.pagamentos;
CREATE POLICY "Admin vê todos os pagamentos"
  ON public.pagamentos FOR SELECT
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_pagamentos_user   ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);

-- 3. Trigger anti-escalada de role/plano/suspenso
CREATE OR REPLACE FUNCTION public.proteger_campos_sensiveis()
RETURNS trigger AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.plano IS DISTINCT FROM OLD.plano
       OR NEW.suspenso IS DISTINCT FROM OLD.suspenso THEN
      RAISE EXCEPTION 'role, plano e suspenso só podem ser alterados pelo servidor';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_profiles_sensitive ON public.profiles;
CREATE TRIGGER protect_profiles_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_campos_sensiveis();
