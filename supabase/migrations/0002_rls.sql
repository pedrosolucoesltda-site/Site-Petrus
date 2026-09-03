-- ============================================================
-- Row Level Security
--
-- Regra de negócio (spec):
--  • Administrador: acesso total, incluindo Financeiro.
--  • Usuário comum: SEM acesso ao Financeiro; em Documentos apenas
--    visualização (não pode excluir / alterar).
--  • Demais módulos: usuário comum pode ler e escrever.
--
-- Toda tabela exige usuário autenticado (anon não lê nada).
-- ============================================================

-- ---------- profiles ----------
alter table profiles enable row level security;

create policy "profiles: ler o próprio + admin lê todos"
  on profiles for select to authenticated
  using (id = auth.uid() or is_admin());

create policy "profiles: atualizar o próprio nome"
  on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));

create policy "profiles: admin gerencia papéis"
  on profiles for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ---------- helper: módulos "abertos" (leitura+escrita p/ autenticado) ----------
-- obras, licitacoes, licitacao_checklist, fornecedores, fornecedor_compras

do $$
declare t text;
begin
  foreach t in array array[
    'obras','licitacoes','licitacao_checklist','fornecedores','fornecedor_compras'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($p$
      create policy "%1$s: autenticado lê" on %1$I
        for select to authenticated using (true);
    $p$, t);
    execute format($p$
      create policy "%1$s: autenticado escreve" on %1$I
        for all to authenticated using (true) with check (true);
    $p$, t);
  end loop;
end $$;

-- ---------- Financeiro: somente administradores ----------
do $$
declare t text;
begin
  foreach t in array array['contas_pagar','contas_receber','fluxo_caixa_mensal']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format($p$
      create policy "%1$s: admin total" on %1$I
        for all to authenticated using (is_admin()) with check (is_admin());
    $p$, t);
  end loop;
end $$;

-- ---------- Documentos: todos leem, só admin escreve/exclui ----------
alter table documentos enable row level security;

create policy "documentos: autenticado lê"
  on documentos for select to authenticated using (true);

create policy "documentos: admin insere"
  on documentos for insert to authenticated with check (is_admin());

create policy "documentos: admin altera"
  on documentos for update to authenticated using (is_admin()) with check (is_admin());

create policy "documentos: admin exclui"
  on documentos for delete to authenticated using (is_admin());

-- ---------- Assistentes de IA: cada usuário só enxerga o seu ----------
alter table assistant_conversations enable row level security;

create policy "conversas: dono"
  on assistant_conversations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table assistant_messages enable row level security;

create policy "mensagens: dono da conversa"
  on assistant_messages for all to authenticated
  using (
    exists (
      select 1 from assistant_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from assistant_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
