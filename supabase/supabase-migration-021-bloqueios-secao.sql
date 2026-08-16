-- ============================================================
-- MATRIZ APROVA — Migração 021
-- Bloqueio temporário de seções do painel.
--
-- Uma linha por seção do painel (seed das 8 seções de estudo). O
-- admin liga/desliga e escreve a mensagem que aparece no cadeado;
-- o usuário vê a seção borrada com bloqueio (SecaoLock), mesmo
-- visual do paywall. Bloqueio é VISUAL — as APIs continuam de pé,
-- é manutenção/conteúdo em preparação, não moderação.
--
-- RLS no padrão dos editais: leitura para qualquer autenticado
-- (o SecaoLock consulta com o client do navegador), escrita só
-- admin — o aluno não desbloqueia a própria seção.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bloqueios_secao (
  secao       text PRIMARY KEY,
  bloqueado   boolean NOT NULL DEFAULT false,
  mensagem    text NOT NULL DEFAULT 'Esta seção está temporariamente indisponível. Voltamos em instantes.',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bloqueios_secao ENABLE ROW LEVEL SECURITY;

-- Leitura: todo autenticado (SecaoLock precisa saber o que travar).
DROP POLICY IF EXISTS "Leitura de bloqueios" ON public.bloqueios_secao;
CREATE POLICY "Leitura de bloqueios"
  ON public.bloqueios_secao FOR SELECT TO authenticated
  USING (true);

-- Escrita: só admin, como o CRUD de editais.
DROP POLICY IF EXISTS "Admin insere bloqueios" ON public.bloqueios_secao;
CREATE POLICY "Admin insere bloqueios"
  ON public.bloqueios_secao FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin edita bloqueios" ON public.bloqueios_secao;
CREATE POLICY "Admin edita bloqueios"
  ON public.bloqueios_secao FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed das seções do painel (mesma lista de SECOES_PAINEL em src/lib/bloqueios.ts).
INSERT INTO public.bloqueios_secao (secao) VALUES
  ('/questoes'),
  ('/simulados'),
  ('/cronometro'),
  ('/materiais'),
  ('/plano'),
  ('/editais'),
  ('/estatisticas'),
  ('/comunidade')
ON CONFLICT (secao) DO NOTHING;
