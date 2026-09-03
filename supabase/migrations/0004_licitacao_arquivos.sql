-- ============================================================
-- Anexos de licitações — Supabase Storage + metadados
-- OBS: SUPERSEDIDA pela 0005_anexos.sql, que generaliza os anexos
-- para todos os módulos e remove a tabela licitacao_arquivos.
-- Mantida por histórico das migrations.
-- ============================================================

-- bucket privado
insert into storage.buckets (id, name, public, file_size_limit)
values ('licitacao-arquivos', 'licitacao-arquivos', false, 52428800)
on conflict (id) do nothing;

-- storage.objects já tem RLS habilitado por padrão no Supabase
do $$
begin
  execute $p$
    create policy "licitacao-arquivos: autenticado le"
      on storage.objects for select to authenticated
      using (bucket_id = 'licitacao-arquivos')
  $p$;
exception when duplicate_object then null; end $$;

do $$
begin
  execute $p$
    create policy "licitacao-arquivos: autenticado envia"
      on storage.objects for insert to authenticated
      with check (bucket_id = 'licitacao-arquivos')
  $p$;
exception when duplicate_object then null; end $$;

do $$
begin
  execute $p$
    create policy "licitacao-arquivos: autenticado atualiza"
      on storage.objects for update to authenticated
      using (bucket_id = 'licitacao-arquivos')
  $p$;
exception when duplicate_object then null; end $$;

do $$
begin
  execute $p$
    create policy "licitacao-arquivos: autenticado remove"
      on storage.objects for delete to authenticated
      using (bucket_id = 'licitacao-arquivos')
  $p$;
exception when duplicate_object then null; end $$;

-- metadados dos anexos
create table if not exists licitacao_arquivos (
  id           uuid primary key default gen_random_uuid(),
  licitacao_id uuid not null references licitacoes (id) on delete cascade,
  nome         text not null,
  caminho      text not null unique,
  tamanho      bigint not null default 0,
  tipo         text,
  criado_por   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists idx_arq_licitacao on licitacao_arquivos (licitacao_id);

alter table licitacao_arquivos enable row level security;

create policy "arquivos: autenticado le"
  on licitacao_arquivos for select to authenticated using (true);

create policy "arquivos: autenticado escreve"
  on licitacao_arquivos for all to authenticated using (true) with check (true);
