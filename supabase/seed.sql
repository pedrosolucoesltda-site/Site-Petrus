-- ============================================================
-- Dados de demonstração — extraídos dos protótipos visuais.
-- Datas de prazo/vencimento são relativas a current_date para
-- que o painel continue "vivo" independentemente de quando rodar.
-- Rode depois das migrations: supabase db reset  (ou psql -f).
-- ============================================================

-- ---------- Obras ----------
insert into obras (id, nome, cidade_uf, status, progresso_pct, responsavel, data_entrega_prevista, orcamento, custo_realizado) values
  ('a0000000-0000-4000-8000-000000000001', 'Residencial Bosque Verde',            'Niterói, RJ',        'em_dia',   72, 'Lucas Cardoso',  current_date + 120, 4100000, 2831000),
  ('a0000000-0000-4000-8000-000000000002', 'Galpão Industrial Zona Oeste',        'Rio de Janeiro, RJ', 'atencao',  41, 'Marina Rocha',   current_date + 210, 2600000, 1107000),
  ('a0000000-0000-4000-8000-000000000003', 'Reforma Sede Administrativa',         'Duque de Caxias, RJ','em_dia',   88, 'Paulo Siqueira', current_date + 55,   890000,  766000),
  ('a0000000-0000-4000-8000-000000000004', 'Condomínio Vista do Mar',             'São Gonçalo, RJ',    'em_dia',   19, 'Lucas Cardoso',  current_date + 300, 5400000, 1018000),
  ('a0000000-0000-4000-8000-000000000005', 'Escola Municipal Jardim das Flores',  'Itaboraí, RJ',       'atrasada', 34, 'Marina Rocha',   current_date + 25,  1900000, 694000),
  ('a0000000-0000-4000-8000-000000000006', 'Ampliação CEDAE — ETE Alegria',       'Rio de Janeiro, RJ', 'em_dia',   56, 'Paulo Siqueira', current_date + 165, 3200000, 1765000)
on conflict (id) do nothing;

-- ---------- Licitações ----------
insert into licitacoes (id, orgao, objeto, valor_estimado, prazo_envio, fase, resultado) values
  ('b0000000-0000-4000-8000-000000000001', 'Prefeitura de Niterói',   'Pavimentação — Bairro Fonseca',     3200000, current_date + 3,  'em_analise',   null),
  ('b0000000-0000-4000-8000-000000000002', 'DER-RJ',                   'Recuperação de via — RJ-104',      5800000, current_date + 11, 'em_analise',   null),
  ('b0000000-0000-4000-8000-000000000003', 'Governo do Estado',       'Reforma escolar — Zona Norte',     2100000, current_date + 19, 'em_analise',   null),
  ('b0000000-0000-4000-8000-000000000004', 'Prefeitura de São Gonçalo','Drenagem — Centro',                4000000, current_date + 8,  'documentacao', null),
  ('b0000000-0000-4000-8000-000000000005', 'CEDAE',                   'Manutenção de rede — Zona Sul',     1600000, current_date + 15, 'enviado',      null),
  ('b0000000-0000-4000-8000-000000000006', 'Prefeitura de Itaboraí',  'Construção de creche municipal',    2900000, current_date - 10, 'resultado',    'vencedor')
on conflict (id) do nothing;

insert into licitacao_checklist (licitacao_id, documento_exigido, entregue) values
  ('b0000000-0000-4000-8000-000000000001', 'Certidão Negativa de Débitos Federais', true),
  ('b0000000-0000-4000-8000-000000000001', 'Certidão FGTS',                         false),
  ('b0000000-0000-4000-8000-000000000001', 'Atestado de Capacidade Técnica',        false),
  ('b0000000-0000-4000-8000-000000000001', 'Balanço Patrimonial',                   false),
  ('b0000000-0000-4000-8000-000000000001', 'Contrato Social',                       false),
  ('b0000000-0000-4000-8000-000000000004', 'Certidão Negativa de Débitos Federais', true),
  ('b0000000-0000-4000-8000-000000000004', 'Certidão FGTS',                         true),
  ('b0000000-0000-4000-8000-000000000004', 'Certidão Trabalhista (CNDT)',           true),
  ('b0000000-0000-4000-8000-000000000004', 'Atestado de Capacidade Técnica',        true),
  ('b0000000-0000-4000-8000-000000000004', 'Balanço Patrimonial',                   true),
  ('b0000000-0000-4000-8000-000000000004', 'Contrato Social',                       true),
  ('b0000000-0000-4000-8000-000000000004', 'ART de responsável técnico',            true),
  ('b0000000-0000-4000-8000-000000000004', 'Comprovante de registro no CREA',       false),
  ('b0000000-0000-4000-8000-000000000004', 'Seguro-garantia',                       false),
  ('b0000000-0000-4000-8000-000000000004', 'Declaração de idoneidade',              false),
  ('b0000000-0000-4000-8000-000000000005', 'Certidão Negativa de Débitos Federais', true),
  ('b0000000-0000-4000-8000-000000000005', 'Certidão FGTS',                         true),
  ('b0000000-0000-4000-8000-000000000005', 'Atestado de Capacidade Técnica',        true),
  ('b0000000-0000-4000-8000-000000000005', 'Balanço Patrimonial',                   true),
  ('b0000000-0000-4000-8000-000000000005', 'Contrato Social',                       true);

-- ---------- Financeiro ----------
insert into contas_pagar (fornecedor, descricao, valor, vencimento, status) values
  ('Concreteira Rio Sul',   'Fornecimento de concreto usinado — Bosque Verde', 42300,  current_date - 2, 'vencido'),
  ('Folha de pagamento',    'Equipe de obras — competência do mês',            118000, current_date + 4, 'a_vencer'),
  ('Equipa Locação',        'Aluguel de equipamentos — Zona Oeste',            26900,  current_date + 9, 'a_vencer'),
  ('Aço Fluminense',        'Vergalhões e telas — Reforma Sede',               31500,  current_date + 16,'a_vencer'),
  ('Energia — concessionária','Consumo canteiro de obras',                     8700,   current_date + 21,'a_vencer'),
  ('Mão de Obra Fluminense','Empreitada de alvenaria — Bosque Verde',          64000,  current_date - 20,'pago');

insert into contas_receber (obra_id, descricao, valor, vencimento, status) values
  ('a0000000-0000-4000-8000-000000000001', 'Medição 7 — Residencial Bosque Verde',      185000, current_date + 6,  'a_vencer'),
  ('a0000000-0000-4000-8000-000000000003', 'Medição final — Reforma Sede Administrativa',96000,  current_date + 12, 'a_vencer'),
  ('a0000000-0000-4000-8000-000000000006', 'Medição 4 — Ampliação CEDAE',               142000, current_date + 18, 'a_vencer'),
  ('a0000000-0000-4000-8000-000000000002', 'Medição 3 — Galpão Industrial Zona Oeste',   63000,  current_date + 25, 'a_vencer'),
  ('a0000000-0000-4000-8000-000000000005', 'Medição 2 — Escola Municipal',               48000,  current_date - 5,  'vencido');

insert into fluxo_caixa_mensal (mes, entradas, saidas) values
  (date_trunc('month', current_date) - interval '4 months', 720000, 540000),
  (date_trunc('month', current_date) - interval '3 months', 610000, 655000),
  (date_trunc('month', current_date) - interval '2 months', 880000, 560000),
  (date_trunc('month', current_date) - interval '1 months', 760000, 610000),
  (date_trunc('month', current_date),                        880000, 720000)
on conflict (mes) do nothing;

-- ---------- Fornecedores ----------
insert into fornecedores (id, nome, categoria, contato, avaliacao) values
  ('c0000000-0000-4000-8000-000000000001', 'Concreteira Rio Sul',           'material',    '(21) 3344-9012',  4),
  ('c0000000-0000-4000-8000-000000000002', 'Equipa Locação de Máquinas',    'equipamento', '(21) 2233-7788',  3),
  ('c0000000-0000-4000-8000-000000000003', 'Mão de Obra Fluminense Ltda',   'mao_de_obra', '(21) 99887-1234', 5),
  ('c0000000-0000-4000-8000-000000000004', 'Aço Fluminense Distribuidora',  'material',    '(24) 3322-5566',  4),
  ('c0000000-0000-4000-8000-000000000005', 'TopGrua Locações',              'equipamento', '(21) 3399-4410',  2),
  ('c0000000-0000-4000-8000-000000000006', 'Britagem Serra Azul',           'material',    '(21) 3130-4455',  4),
  ('c0000000-0000-4000-8000-000000000007', 'Elétrica Predial RJ',           'mao_de_obra', '(21) 98123-7766', 3)
on conflict (id) do nothing;

insert into fornecedor_compras (fornecedor_id, obra_id, valor, data) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 286200, current_date - 15),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 200000, current_date - 45),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 118900, current_date - 8),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 402000, current_date - 4),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 300000, current_date - 30),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 200000, current_date - 60),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 214500, current_date - 21),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 76400,  current_date - 60);

-- ---------- Documentos ----------
insert into documentos (nome, categoria, obra_id, licitacao_id, data_validade, arquivo_url) values
  ('Contrato Social consolidado',              'societario', null, null, null,                    null),
  ('Certidão Negativa de Débitos Federais',    'certidoes',  null, null, current_date + 12,       null),
  ('Certidão FGTS (CRF)',                      'certidoes',  null, null, current_date + 3,        null),
  ('Certidão Trabalhista (CNDT)',              'certidoes',  null, null, current_date - 4,        null),
  ('Balanço Patrimonial 2025',                 'societario', null, null, null,                    null),
  ('ART — Residencial Bosque Verde',           'arts_rrts',  'a0000000-0000-4000-8000-000000000001', null, current_date + 200, null),
  ('ART — Reforma Sede Administrativa',        'arts_rrts',  'a0000000-0000-4000-8000-000000000003', null, current_date + 40,  null),
  ('Contrato de execução — Bosque Verde',      'contratos',  'a0000000-0000-4000-8000-000000000001', null, null,               null),
  ('Contrato de execução — Galpão Zona Oeste', 'contratos',  'a0000000-0000-4000-8000-000000000002', null, null,               null),
  ('Edital assinado — Creche Itaboraí',        'licitacoes', null, 'b0000000-0000-4000-8000-000000000006', null,               null),
  ('Proposta técnica — Drenagem São Gonçalo',  'licitacoes', null, 'b0000000-0000-4000-8000-000000000004', null,               null),
  ('Diário de obra — Escola Municipal',        'obras',      'a0000000-0000-4000-8000-000000000005', null, null,               null);
