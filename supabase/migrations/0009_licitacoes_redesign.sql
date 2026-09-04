-- ============================================================
-- Licitações: modelo ampliado (processo, modalidade, UF, proposta,
-- classificação, data/hora da disputa) + novo conjunto de status.
-- Substitui a coluna `fase` / enum `licitacao_fase`.
-- ============================================================

create type licitacao_status as enum (
  'aberta',
  'em_proposta',
  'aguardando_julgamento',
  'selecao_fornecedores',
  'resultado'
);

create type licitacao_modalidade as enum (
  'concorrencia_eletronica',
  'concorrencia_presencial',
  'pregao_eletronico',
  'pregao_presencial',
  'dispensa_eletronica',
  'tomada_de_precos',
  'credenciamento',
  'outras'
);

alter table licitacoes
  add column if not exists processo         text,
  add column if not exists modalidade       licitacao_modalidade not null default 'outras',
  add column if not exists modalidade_numero text,
  add column if not exists uf               text,
  add column if not exists valor_proposta   numeric(14,2),
  add column if not exists classificacao    int check (classificacao is null or classificacao >= 1),
  add column if not exists data_disputa     timestamptz,
  add column if not exists status           licitacao_status not null default 'aberta';

-- fase antiga -> novo status
update licitacoes set status = case fase
  when 'em_analise'   then 'aberta'
  when 'documentacao' then 'em_proposta'
  when 'enviado'      then 'aguardando_julgamento'
  when 'resultado'    then 'resultado'
  else 'aberta'
end::licitacao_status;

-- data_disputa a partir do antigo prazo_envio (09:00 no fuso de Brasília)
update licitacoes
  set data_disputa = ((prazo_envio + time '09:00') at time zone 'America/Sao_Paulo')
  where data_disputa is null and prazo_envio is not null;

alter table licitacoes drop column if exists fase;
drop type if exists licitacao_fase;

create index if not exists idx_licitacoes_data on licitacoes (data_disputa);
create index if not exists idx_licitacoes_status on licitacoes (status);
