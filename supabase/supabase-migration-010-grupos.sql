-- ============================================================
-- MATRIZ APROVA — Migração 010
-- Tabelas de grupos de estudo da comunidade.
--
-- `grupos` guarda o grupo (quem criou, matéria, descrição) e
-- `membros` a participação. Um trigger insere o criador como
-- primeiro membro automaticamente.
--
-- RLS: qualquer autenticado vê os grupos; criar exige que o
-- usuário logado seja o criador; entrar/sair mexe só na própria
-- linha de `membros`. Admin gerencia `grupos`.
--
-- Idempotente: pode rodar mais de uma vez no SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.grupos (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL CHECK (char_length(nome) >= 3),
  descricao  text NOT NULL DEFAULT '',
  materia    text NOT NULL,
  criador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.membros (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id   uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grupo_id, user_id)
);

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Autenticados leem grupos" ON public.grupos;
CREATE POLICY "Autenticados leem grupos"
  ON public.grupos FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuário cria grupo" ON public.grupos;
CREATE POLICY "Usuário cria grupo"
  ON public.grupos FOR INSERT
  WITH CHECK (auth.uid() = criador_id);

DROP POLICY IF EXISTS "Admin edita grupos" ON public.grupos;
CREATE POLICY "Admin edita grupos"
  ON public.grupos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admin exclui grupos" ON public.grupos;
CREATE POLICY "Admin exclui grupos"
  ON public.grupos FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Autenticados leem membros" ON public.membros;
CREATE POLICY "Autenticados leem membros"
  ON public.membros FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuário participa de grupo" ON public.membros;
CREATE POLICY "Usuário participa de grupo"
  ON public.membros FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário sai de grupo" ON public.membros;
CREATE POLICY "Usuário sai de grupo"
  ON public.membros FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_grupos_materia    ON public.grupos(materia);
CREATE INDEX IF NOT EXISTS idx_membros_grupo     ON public.membros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_membros_user      ON public.membros(user_id);

-- Criador entra no grupo automaticamente ao criá-lo.
CREATE OR REPLACE FUNCTION public.handle_novo_grupo()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.membros (grupo_id, user_id)
  VALUES (new.id, new.criador_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_grupo_created ON public.grupos;
CREATE TRIGGER on_grupo_created
  AFTER INSERT ON public.grupos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_novo_grupo();
