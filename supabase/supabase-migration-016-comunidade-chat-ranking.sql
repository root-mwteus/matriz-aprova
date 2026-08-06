-- ============================================================
-- MATRIZ APROVA — Migração 016
-- Chat ao vivo da comunidade + ranking de questões/acertos.
--
-- `mensagens` guarda as mensagens do chat. `grupo_id` NULL significa
-- chat geral; preenchido, é o chat daquele grupo. O mesmo canal de
-- Realtime serve para os dois: o cliente filtra por `grupo_id`.
--
-- O ranking não precisa de tabela nova: ele agrega `user_answers`
-- (quantas questões cada um resolveu e quantos acertos) no servidor,
-- via /api/comunidade/ranking e /api/comunidade/grupos/[id]/ranking.
--
-- RLS: todo autenticado lê o chat geral; o chat de grupo é lido apenas
-- por membros. Enviar mensagem exige ser o autor e, em grupo, ser
-- membro. Realtime é liberado na tabela no final.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.mensagens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo_id   uuid REFERENCES public.grupos(id) ON DELETE CASCADE,
  conteudo   text NOT NULL CHECK (char_length(conteudo) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Leitura: chat geral para todos; chat de grupo só para membros.
DROP POLICY IF EXISTS "Leitura de mensagens" ON public.mensagens;
CREATE POLICY "Leitura de mensagens"
  ON public.mensagens FOR SELECT
  USING (
    grupo_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.membros m
      WHERE m.grupo_id = mensagens.grupo_id AND m.user_id = auth.uid()
    )
  );

-- Inserção: autor é o próprio usuário e, se for chat de grupo, ele é membro.
DROP POLICY IF EXISTS "Inserção de mensagens" ON public.mensagens;
CREATE POLICY "Inserção de mensagens"
  ON public.mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      grupo_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.membros m
        WHERE m.grupo_id = mensagens.grupo_id AND m.user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_mensagens_created_at ON public.mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_grupo      ON public.mensagens(grupo_id, created_at DESC);

-- Realtime: o cliente assina INSERT nesta tabela para atualizar o chat
-- em tempo real (global e por grupo, filtrando pelo campo `grupo_id`).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mensagens'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
    END IF;
  END IF;
END $$;

-- ============================================================
-- RANKING
-- Agregação feita no banco (COUNT), não no cliente: traz só o
-- resumo por usuário. `SECURITY DEFINER` porque `user_answers`
-- tem RLS do próprio usuário; a rota /api autentica quem chama.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ranking_questoes(p_limite integer DEFAULT 50)
RETURNS TABLE (user_id uuid, questoes bigint, acertos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.user_id,
         COUNT(*)::bigint AS questoes,
         COUNT(*) FILTER (WHERE a.correto)::bigint AS acertos
  FROM public.user_answers a
  GROUP BY a.user_id
  ORDER BY acertos DESC, questoes DESC
  LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.ranking_questoes(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.ranking_grupo(p_grupo_id uuid, p_limite integer DEFAULT 50)
RETURNS TABLE (user_id uuid, questoes bigint, acertos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.user_id,
         COUNT(*)::bigint AS questoes,
         COUNT(*) FILTER (WHERE a.correto)::bigint AS acertos
  FROM public.user_answers a
  WHERE a.user_id IN (
    SELECT m.user_id FROM public.membros m WHERE m.grupo_id = p_grupo_id
  )
  GROUP BY a.user_id
  ORDER BY acertos DESC, questoes DESC
  LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.ranking_grupo(uuid, integer) TO authenticated;

