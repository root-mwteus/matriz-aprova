-- ============================================================
-- MATRIZ APROVA — Migração 014
-- Configuração de pagamentos e planos (editável pelo admin).
--
--   `config_pagamentos` guarda o que o admin controla no painel:
--     · nome/título do plano
--     · preço (em centavos)
--     · benefícios anunciados no checkout
--     · limite diário de questões do plano demo
--     · aviso de bloqueio exibido ao usuário sem pagamento
--     · flag `pagamentos_ativos` (liga/desliga o checkout)
--
-- daqui em vez do valor fixo em código, então mudar o preço no
-- painel admin passa a valer para novos pagamentos imediatamente.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

-- 1. Tabela de configuração
CREATE TABLE IF NOT EXISTS public.config_pagamentos (
  id                  integer PRIMARY KEY CHECK (id = 1),
  titulo_plano        text NOT NULL DEFAULT 'Plano Vitalício Matriz Aprovação',
  descricao_plano     text NOT NULL DEFAULT 'Um pagamento. Acesso completo para sempre.',
  valor_centavos      integer NOT NULL DEFAULT 4999
                      CHECK (valor_centavos > 0),
  beneficios          jsonb NOT NULL DEFAULT '[
                          "Acesso às 4 áreas (Concursos, OAB, Militar, ENEM)",
                          "Banco de questões comentadas sem limite",
                          "Materiais em PDF completos",
                          "IA Preditiva da sua banca",
                          "Simulados com ranking nacional",
                          "Plano de estudos personalizado"
                        ]'::jsonb,
  limite_questoes_demo integer NOT NULL DEFAULT 10
                       CHECK (limite_questoes_demo >= 0),
  aviso_bloqueio      text NOT NULL DEFAULT 'Você está no plano demo. Assine o plano vitalício para desbloquear o acesso completo à plataforma.',
  pagamentos_ativos   boolean NOT NULL DEFAULT true,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.config_pagamentos ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário logado lê a configuração (o checkout e a página
-- /assinar precisam saber o preço). Só admin atualiza.
DROP POLICY IF EXISTS "Qualquer logado lê a config de pagamentos" ON public.config_pagamentos;
CREATE POLICY "Qualquer logado lê a config de pagamentos"
  ON public.config_pagamentos FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin atualiza a config de pagamentos" ON public.config_pagamentos;
CREATE POLICY "Admin atualiza a config de pagamentos"
  ON public.config_pagamentos FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin insere a config de pagamentos" ON public.config_pagamentos;
CREATE POLICY "Admin insere a config de pagamentos"
  ON public.config_pagamentos FOR INSERT
  WITH CHECK (public.is_admin());

-- 2. Seed — a linha única com os padrões
INSERT INTO public.config_pagamentos (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
