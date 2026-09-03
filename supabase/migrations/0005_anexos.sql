-- ============================================================
-- Anexos genéricos — um bucket + uma tabela polimórfica para
-- todos os módulos (obras, licitações, documentos, contas).
-- Substitui licitacao_arquivos (0004).
-- ============================================================

-- bucket único
insert into storage.buckets (id, name, public, file_size_limit)
values ('anexos', 'anexos', false, 52428800)
on conflict (id) do nothing;

do $$ begin
  execute $p$create policy "anexos: autenticado le" on storage.objects
    for select to authenticated using (bucket_id = 'anexos')$p$;
exception when duplicate_object then null; end $$;
do $$ begin
  execute $p$create policy "anexos: autenticado envia" on storage.objects
    for insert to authenticated with check (bucket_id = 'anexos')$p$;
exception when duplicate_object then null; end $$;
do $$ begin
  execute $p$create policy "anexos: autenticado atualiza" on storage.objects
    for update to authenticated using (bucket_id = 'anexos')$p$;
exception when duplicate_object then null; end $$;
do $$ begin
  execute $p$create policy "anexos: autenticado remove" on storage.objects
    for delete to authenticated using (bucket_id = 'anexos')$p$;
exception when duplicate_object then null; end $$;

-- ---------- tabela ----------
do $$ begin
  create type anexo_escopo as enum
    ('obra', 'licitacao', 'documento', 'conta_pagar', 'conta_receber');
exception when duplicate_object then null; end $$;

create table if not exists anexos (
  id         uuid primary key default gen_random_uuid(),
  escopo     anexo_escopo not null,
  ref_id     uuid not null,
  nome       text not null,
  caminho    text not null unique,
  tamanho    bigint not null default 0,
  tipo       text,
  criado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_anexos_ref on anexos (escopo, ref_id);

alter table anexos enable row level security;

-- Financeiro é restrito a admin; demais escopos, qualquer autenticado.
create policy "anexos: leitura"
  on anexos for select to authenticated
  using (escopo not in ('conta_pagar', 'conta_receber') or is_admin());

create policy "anexos: escrita"
  on anexos for all to authenticated
  using (escopo not in ('conta_pagar', 'conta_receber') or is_admin())
  with check (escopo not in ('conta_pagar', 'conta_receber') or is_admin());

-- ---------- limpar metadados quando o dono é excluído ----------
create or replace function delete_anexos_do_registro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.anexos
  where escopo = tg_argv[0]::public.anexo_escopo and ref_id = old.id;
  return old;
end;
$$;

do $$
declare r record;
begin
  for r in
    select unnest(array['obras','licitacoes','documentos','contas_pagar','contas_receber']) as tbl,
           unnest(array['obra','licitacao','documento','conta_pagar','conta_receber']) as esc
  loop
    execute format('drop trigger if exists trg_anexos_%1$s on %1$s;', r.tbl);
    execute format(
      'create trigger trg_anexos_%1$s after delete on %1$s
         for each row execute function delete_anexos_do_registro(%2$L);',
      r.tbl, r.esc);
  end loop;
end $$;

-- ---------- migrar/remover a tabela antiga ----------
insert into anexos (id, escopo, ref_id, nome, caminho, tamanho, tipo, criado_por, created_at)
select id, 'licitacao', licitacao_id, nome, caminho, tamanho, tipo, criado_por, created_at
from licitacao_arquivos
on conflict (id) do nothing;

drop table if exists licitacao_arquivos;
