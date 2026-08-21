-- 030: importações em massa de questões (PDF/URL via IA, preview obrigatório)
-- A tabela audita cada job de extração; o `parse` é efêmero (sem gravar questions)
-- e o `confirmar` faz o upsert idempotente por codigo_importacao.
create table if not exists public.importacoes_questoes (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  fonte_tipo text not null check (fonte_tipo in ('pdf','url')),
  arquivo_path text,
  urls text[] default '{}'::text[],
  status text not null default 'pending' check (status in ('pending','processing','done','error')),
  total_extraidas integer not null default 0,
  total_confirmadas integer not null default 0,
  custo_tokens integer not null default 0,
  erro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_importacoes_questoes_admin on public.importacoes_questoes(admin_id, created_at desc);

alter table public.importacoes_questoes enable row level security;

drop policy if exists "Importacoes visíveis para admin" on public.importacoes_questoes;
create policy "Importacoes visíveis para admin"
  on public.importacoes_questoes for select
  using (public.is_admin());

drop policy if exists "Admin gerencia importacoes" on public.importacoes_questoes;
create policy "Admin gerencia importacoes"
  on public.importacoes_questoes for all
  using (public.is_admin())
  with check (public.is_admin());
