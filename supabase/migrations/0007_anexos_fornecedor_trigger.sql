-- Trigger de limpeza dos anexos ao excluir um fornecedor.
drop trigger if exists trg_anexos_fornecedores on fornecedores;
create trigger trg_anexos_fornecedores
  after delete on fornecedores
  for each row execute function delete_anexos_do_registro('fornecedor');
