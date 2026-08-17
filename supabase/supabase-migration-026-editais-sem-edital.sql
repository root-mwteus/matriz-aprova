-- 026: Novo status "sem_edital" para editais de provas já realizadas
-- sem edital novo publicado. A página mostra os dados da última edição.
-- Para não depender de nome de constraint, descarta a CHECK atual e recria
-- com o valor extra.
alter table public.editais
  drop constraint if exists editais_status_check;

alter table public.editais
  add constraint editais_status_check
  check (status in ('aberto', 'encerrado', 'previsto', 'sem_edital'));