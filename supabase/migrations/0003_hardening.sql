-- ============================================================
-- Ajustes de segurança apontados pelo linter do Supabase:
--  • search_path fixo nas funções (evita sequestro de search_path)
--  • funções SECURITY DEFINER não expostas via PostgREST RPC
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function documento_status(data_validade date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when data_validade is null then 'valido'
    when data_validade < current_date then 'vencido'
    when data_validade < current_date + 30 then 'vencendo'
    else 'valido'
  end;
$$;

-- handle_new_user() é só função de trigger — ninguém deve chamá-la via RPC
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- is_admin() é usada dentro das policies (o papel `authenticated` precisa
-- conseguir avaliá-la); apenas bloqueia o acesso anônimo.
revoke execute on function public.is_admin() from anon, public;
