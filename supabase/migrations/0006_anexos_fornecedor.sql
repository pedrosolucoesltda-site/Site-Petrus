-- Anexos: adiciona o escopo 'fornecedor'.
-- (Em arquivo separado do trigger — ADD VALUE não pode ser usado na
--  mesma transação em que o valor é referenciado.)
alter type anexo_escopo add value if not exists 'fornecedor';
