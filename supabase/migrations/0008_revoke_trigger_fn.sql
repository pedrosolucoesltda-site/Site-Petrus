-- delete_anexos_do_registro() só roda como trigger — ninguém deve
-- chamá-la via PostgREST RPC. Fecha o aviso do linter.
revoke execute on function public.delete_anexos_do_registro() from anon, authenticated, public;
