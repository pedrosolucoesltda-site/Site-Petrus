-- ============================================================
-- Linha do tempo de Licitações — log de todas as alterações.
-- Somente leitura + inserção; log imutável (sem update/delete).
-- ============================================================

create table if not exists licitacao_atividades (
  id              uuid primary key default gen_random_uuid(),
  licitacao_id    uuid references licitacoes (id) on delete set null,
  licitacao_label text not null default '',
  user_id         uuid references auth.users (id) on delete set null,
  user_nome       text not null default '',
  acao            text not null,   -- criou | editou | moveu | excluiu | checklist | anexo | resultado
  descricao       text not null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_atividades_created on licitacao_atividades (created_at desc);
create index if not exists idx_atividades_licitacao on licitacao_atividades (licitacao_id);

alter table licitacao_atividades enable row level security;

create policy "atividades: autenticado lê"
  on licitacao_atividades for select to authenticated using (true);

create policy "atividades: autenticado registra"
  on licitacao_atividades for insert to authenticated with check (true);
