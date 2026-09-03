-- ============================================================
-- ERP Petrus Soluções — schema
-- 6 módulos: Painel Geral (agregado), Obras, Licitações,
-- Financeiro, Documentos, Fornecedores.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type obra_status as enum ('em_dia', 'atencao', 'atrasada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type licitacao_fase as enum ('em_analise', 'documentacao', 'enviado', 'resultado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type licitacao_resultado as enum ('vencedor', 'perdido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type conta_status as enum ('a_vencer', 'vencido', 'pago');
exception when duplicate_object then null; end $$;

do $$ begin
  create type documento_categoria as enum
    ('contratos', 'certidoes', 'arts_rrts', 'societario', 'obras', 'licitacoes');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fornecedor_categoria as enum ('material', 'mao_de_obra', 'equipamento');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

-- ---------- shared updated_at trigger ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- profiles — 1:1 with auth.users, carries the access role
-- ============================================================
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- New auth users get a profile automatically (default role = 'user').
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Helper used throughout RLS: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Obras
-- ============================================================
create table if not exists obras (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  cidade_uf             text not null default '',
  status                obra_status not null default 'em_dia',
  progresso_pct         int not null default 0 check (progresso_pct between 0 and 100),
  responsavel           text,
  data_entrega_prevista date,
  orcamento             numeric(14,2) not null default 0,
  custo_realizado       numeric(14,2) not null default 0,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- Licitações
-- ============================================================
create table if not exists licitacoes (
  id             uuid primary key default gen_random_uuid(),
  orgao          text not null,
  objeto         text not null,
  valor_estimado numeric(14,2) not null default 0,
  prazo_envio    date,
  fase           licitacao_fase not null default 'em_analise',
  resultado      licitacao_resultado,
  created_at     timestamptz not null default now()
);

create table if not exists licitacao_checklist (
  id                uuid primary key default gen_random_uuid(),
  licitacao_id      uuid not null references licitacoes (id) on delete cascade,
  documento_exigido text not null,
  entregue          boolean not null default false
);
create index if not exists idx_checklist_licitacao on licitacao_checklist (licitacao_id);

-- ============================================================
-- Financeiro (restrito a administradores via RLS)
-- ============================================================
create table if not exists contas_pagar (
  id         uuid primary key default gen_random_uuid(),
  fornecedor text not null,
  descricao  text not null default '',
  valor      numeric(14,2) not null default 0,
  vencimento date not null,
  status     conta_status not null default 'a_vencer',
  created_at timestamptz not null default now()
);
create index if not exists idx_contas_pagar_venc on contas_pagar (vencimento);

create table if not exists contas_receber (
  id         uuid primary key default gen_random_uuid(),
  obra_id    uuid references obras (id) on delete set null,
  descricao  text not null default '',
  valor      numeric(14,2) not null default 0,
  vencimento date not null,
  status     conta_status not null default 'a_vencer',
  created_at timestamptz not null default now()
);
create index if not exists idx_contas_receber_venc on contas_receber (vencimento);

create table if not exists fluxo_caixa_mensal (
  id       uuid primary key default gen_random_uuid(),
  mes      date not null unique,           -- primeiro dia do mês
  entradas numeric(14,2) not null default 0,
  saidas   numeric(14,2) not null default 0
);

-- ============================================================
-- Documentos
-- status é derivado de data_validade (valido / vencendo / vencido)
-- ============================================================
create table if not exists documentos (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  categoria     documento_categoria not null,
  obra_id       uuid references obras (id) on delete set null,
  licitacao_id  uuid references licitacoes (id) on delete set null,
  data_validade date,
  arquivo_url   text,
  created_at    timestamptz not null default now()
);

create or replace function documento_status(data_validade date)
returns text
language sql
immutable
as $$
  select case
    when data_validade is null then 'valido'
    when data_validade < current_date then 'vencido'
    when data_validade < current_date + 30 then 'vencendo'
    else 'valido'
  end;
$$;

-- ============================================================
-- Fornecedores
-- ============================================================
create table if not exists fornecedores (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  categoria  fornecedor_categoria not null,
  contato    text,
  avaliacao  int not null default 3 check (avaliacao between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists fornecedor_compras (
  id            uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores (id) on delete cascade,
  obra_id       uuid references obras (id) on delete set null,
  valor         numeric(14,2) not null default 0,
  data          date not null default current_date
);
create index if not exists idx_compras_fornecedor on fornecedor_compras (fornecedor_id);
create index if not exists idx_compras_obra on fornecedor_compras (obra_id);

-- ============================================================
-- Histórico de conversa com os assistentes de IA (por usuário)
-- ============================================================
create table if not exists assistant_conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  assistant_key text not null,
  title         text not null default 'Nova conversa',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_conv_user on assistant_conversations (user_id, assistant_key);

drop trigger if exists trg_conv_updated on assistant_conversations;
create trigger trg_conv_updated
  before update on assistant_conversations
  for each row execute function set_updated_at();

create table if not exists assistant_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations (id) on delete cascade,
  role            chat_role not null,
  content         text not null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_msg_conv on assistant_messages (conversation_id, created_at);
