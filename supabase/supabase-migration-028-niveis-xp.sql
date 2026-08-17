-- ============================================================
-- MATRIZ APROVA — Migração 028
-- Níveis e XP.
--
-- `profiles.xp_total` acumula XP de quem estuda; o nível é função
-- pura do XP no código (src/lib/xp.ts), não uma coluna — nada
-- dessincroniza.
--
-- `xp_historico` é a razão de XP: cada lance pontua uma linha com
-- (user_id, tipo, origem_id) UNIQUE. O dedupe por origem impede que
-- retry/duplicidade da mesma resposta, simulado ou duelo pontue duas
-- vezes. `somar_xp` também aplica um teto diário (XP_DIARIO_MAX) para
-- limitar farming — o valor é uma constante no SQL, fácil de ajustar.
--
-- Escrita é exclusiva da service role (função SECURITY DEFINER sem
-- grant a authenticated), como `somar_pontos_liga` — o cliente não
-- fabrica XP.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp_total integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.xp_historico (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo       text NOT NULL CHECK (tipo IN ('questao', 'simulado', 'duelo')),
  origem_id  text NOT NULL,
  xp         integer NOT NULL,
  data       date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo, origem_id)
);

ALTER TABLE public.xp_historico ENABLE ROW LEVEL SECURITY;

-- Ranking/consulta do próprio histórico por dia.
CREATE INDEX IF NOT EXISTS idx_xp_historico_user_data
  ON public.xp_historico(user_id, data);

-- Teto diário de XP (ajustável aqui). 1000/dia ≈ 50 questões certas
-- ou 100 respostas — folga para quem estuda pesado, trava farm.
CREATE OR REPLACE FUNCTION public.somar_xp(
  p_user_id uuid,
  p_tipo text,
  p_origem_id text,
  p_xp integer
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_hoje       date := (now() AT TIME ZONE 'UTC')::date;
  v_max        constant integer := 1000;
  v_ja         integer;
  v_permitido  integer;
BEGIN
  IF p_xp <= 0 THEN RETURN; END IF;

  -- Mesma origem já pontuou? (retry de resposta/simulado/duelo) → ignora.
  IF EXISTS (
    SELECT 1 FROM public.xp_historico
    WHERE user_id = p_user_id AND tipo = p_tipo AND origem_id = p_origem_id
  ) THEN
    RETURN;
  END IF;

  -- Teto diário: pontua só o que cabe no dia.
  SELECT COALESCE(SUM(xp), 0) INTO v_ja
  FROM public.xp_historico
  WHERE user_id = p_user_id AND data = v_hoje;

  v_permitido := LEAST(p_xp, GREATEST(0, v_max - v_ja));
  IF v_permitido <= 0 THEN RETURN; END IF;

  INSERT INTO public.xp_historico (user_id, tipo, origem_id, xp, data)
  VALUES (p_user_id, p_tipo, p_origem_id, v_permitido, v_hoje);

  UPDATE public.profiles
  SET xp_total = xp_total + v_permitido
  WHERE id = p_user_id;
END $$;
