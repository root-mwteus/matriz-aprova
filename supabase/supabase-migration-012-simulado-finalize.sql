-- ============================================================
-- MATRIZ APROVA — Migração 012
-- Endurece o ranking de simulados e o acesso ao storage:
--   1. Remove a policy de UPDATE de `simulations` para o cliente.
--      Finalizar um simulado (gravar pontuação) passa a exigir
--      /api/simulados/[id]/finalizar, que recomputa os acertos no
--      servidor — o usuário não consegue mais inflar a própria
--      pontuação/tempo direto pela API do Supabase.
--   2. Restringe a SELECT do bucket `materiais`: qualquer autenticado
--      lia/enumerava qualquer objeto do bucket. Agora só objetos que
--      constam em `materials.pdf_url` são legíveis (signed URL).
--
-- Idempotente: pode rodar mais de uma vez.
-- ============================================================

-- 1. Anti-cheat de simulado
DROP POLICY IF EXISTS "Usuário atualiza apenas suas próprias simulações" ON public.simulations;

-- 2. Storage: leitura restrita aos PDFs cadastrados em `materials`
DROP POLICY IF EXISTS "Autenticados leem materiais do storage" ON storage.objects;
CREATE POLICY "Autenticados leem materiais do storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'materiais'
    AND EXISTS (
      SELECT 1 FROM public.materials m
      WHERE m.pdf_url = storage.objects.name
    )
  );
