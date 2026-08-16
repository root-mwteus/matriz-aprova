-- ============================================================
-- MATRIZ APROVA — Migração 018
-- Alertas de editais por e-mail + histórico de logins.
--
-- `edital_alertas` é o dedupe do cron de alertas: PK composta
-- (user_id, edital_id) garante que cada usuário receba cada edital
-- no máximo uma vez — o INSERT ... ON CONFLICT DO NOTHING decide
-- quem recebe o e-mail, sem corrida.
--
-- `login_events` alimenta a página /seguranca (dispositivos e
-- acessos da conta). Ambas escritas só pela service role: sem
-- policy de INSERT, o cliente não forja alerta nem histórico.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.edital_alertas (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edital_id  uuid NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
  enviado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, edital_id)
);

ALTER TABLE public.edital_alertas ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas a própria linha (o usuário vê o que já recebeu).
DROP POLICY IF EXISTS "Leitura dos próprios alertas" ON public.edital_alertas;
CREATE POLICY "Leitura dos próprios alertas"
  ON public.edital_alertas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.login_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  navegador  text NOT NULL,
  sistema    text NOT NULL,
  ip         text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Leitura: apenas os próprios eventos.
DROP POLICY IF EXISTS "Leitura dos próprios logins" ON public.login_events;
CREATE POLICY "Leitura dos próprios logins"
  ON public.login_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_login_events_user ON public.login_events(user_id, created_at DESC);
