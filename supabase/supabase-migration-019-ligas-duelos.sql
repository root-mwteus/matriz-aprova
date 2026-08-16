-- ============================================================
-- MATRIZ APROVA — Migração 019
-- Ligas semanais + duelos 1v1.
--
-- `liga_pontos` acumula os pontos da semana (chave = segunda-feira
-- da semana corrente). A semana "vira" sozinha pela chave — não há
-- cron de reset; a liga de cada um é a fatia de 50 posições que ele
-- ocupa no ranking da semana.
--
-- `duelos`: fila rápida de 5 questões. O gabarito NÃO é guardado na
-- linha (questoes é só um array de ids) — a resposta certa é buscada
-- em questions na hora de validar, no servidor, como em
-- /api/questoes/responder. Sem isso, o payload do Realtime (UPDATE
-- da linha) vazaria o gabarito para os dois jogadores.
--
-- Escrita das duas tabelas é exclusiva da service role (sem policy
-- de INSERT/UPDATE) — pontos e placares não são editáveis pelo
-- cliente. `duelos` entra na publicação do Realtime para os
-- jogadores acompanharem o progresso um do outro.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.liga_pontos (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  semana  date NOT NULL,
  pontos  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, semana)
);

ALTER TABLE public.liga_pontos ENABLE ROW LEVEL SECURITY;

-- Leitura: todo autenticado vê o ranking da semana (é o propósito
-- da tabela — liga pública como o ranking de questões).
DROP POLICY IF EXISTS "Leitura do ranking da liga" ON public.liga_pontos;
CREATE POLICY "Leitura do ranking da liga"
  ON public.liga_pontos FOR SELECT TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_liga_pontos_semana ON public.liga_pontos(semana, pontos DESC);

-- ── Duelos ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.duelos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status      text NOT NULL DEFAULT 'aguardando'
              CHECK (status IN ('aguardando','ativo','finalizado','expirado','cancelado')),
  jogador_a   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jogador_b   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  questoes    jsonb NOT NULL DEFAULT '[]',
  respostas_a jsonb NOT NULL DEFAULT '[]',
  respostas_b jsonb NOT NULL DEFAULT '[]',
  acertos_a   integer NOT NULL DEFAULT 0,
  acertos_b   integer NOT NULL DEFAULT 0,
  tempo_a     integer NOT NULL DEFAULT 0,
  tempo_b     integer NOT NULL DEFAULT 0,
  vencedor    uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  started_at  timestamptz
);

ALTER TABLE public.duelos ENABLE ROW LEVEL SECURITY;

-- Leitura: só os jogadores da partida (e admin).
DROP POLICY IF EXISTS "Leitura dos próprios duelos" ON public.duelos;
CREATE POLICY "Leitura dos próprios duelos"
  ON public.duelos FOR SELECT TO authenticated
  USING (
    auth.uid() = jogador_a OR auth.uid() = jogador_b
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_duelos_status ON public.duelos(status, created_at);
CREATE INDEX IF NOT EXISTS idx_duelos_jogador_a ON public.duelos(jogador_a);

-- Realtime: progresso do oponente chega como UPDATE da linha.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'duelos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.duelos;
  END IF;
END $$;

-- ── Ranking da semana (nomes resolvidos no servidor, como ranking_questoes) ──

-- Incremento atômico (INSERT ... ON CONFLICT DO UPDATE): duas respostas
-- simultâneas não se perdem por leitura-escrita corrida. SEM grant para
-- authenticated — quem soma ponto é o servidor (service role), senão
-- qualquer cliente fabricaria pontuação.
CREATE OR REPLACE FUNCTION public.somar_pontos_liga(p_user_id uuid, p_semana date, p_pontos integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.liga_pontos (user_id, semana, pontos)
  VALUES (p_user_id, p_semana, p_pontos)
  ON CONFLICT (user_id, semana) DO UPDATE SET pontos = public.liga_pontos.pontos + p_pontos;
END $$;

CREATE OR REPLACE FUNCTION public.ranking_liga(p_semana date DEFAULT NULL, p_limite integer DEFAULT 200)
RETURNS TABLE (user_id uuid, pontos bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT l.user_id, l.pontos::bigint
  FROM public.liga_pontos l
  WHERE l.semana = COALESCE(p_semana, date_trunc('week', now())::date)
  ORDER BY l.pontos DESC, l.user_id
  LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.ranking_liga(date, integer) TO authenticated;
