/**
 * Hand-maintained mirror of the Supabase schema in supabase/migrations.
 * Regenerate with `npx supabase gen types typescript` once the project is linked.
 *
 * Row shapes are `type` aliases (not interfaces) on purpose: supabase-js's
 * `GenericSchema` constraint requires them to be assignable to
 * `Record<string, unknown>`, which interfaces are not.
 */

export type ObraStatus = "em_dia" | "atencao" | "atrasada";
export type LicitacaoFase =
  | "em_analise"
  | "documentacao"
  | "enviado"
  | "resultado";
export type LicitacaoResultado = "vencedor" | "perdido";
export type ContaStatus = "a_vencer" | "vencido" | "pago";
export type DocumentoCategoria =
  | "contratos"
  | "certidoes"
  | "arts_rrts"
  | "societario"
  | "obras"
  | "licitacoes";
export type FornecedorCategoria = "material" | "mao_de_obra" | "equipamento";
export type UserRole = "admin" | "user";
export type ChatRole = "user" | "assistant";

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Obra = {
  id: string;
  nome: string;
  cidade_uf: string;
  status: ObraStatus;
  progresso_pct: number;
  responsavel: string | null;
  data_entrega_prevista: string | null;
  orcamento: number;
  custo_realizado: number;
  created_at: string;
};

export type Licitacao = {
  id: string;
  orgao: string;
  objeto: string;
  valor_estimado: number;
  prazo_envio: string | null;
  fase: LicitacaoFase;
  resultado: LicitacaoResultado | null;
  created_at: string;
};

export type LicitacaoChecklist = {
  id: string;
  licitacao_id: string;
  documento_exigido: string;
  entregue: boolean;
};

export type AnexoEscopo =
  | "obra"
  | "licitacao"
  | "documento"
  | "fornecedor"
  | "conta_pagar"
  | "conta_receber";

export type Anexo = {
  id: string;
  escopo: AnexoEscopo;
  ref_id: string;
  nome: string;
  caminho: string;
  tamanho: number;
  tipo: string | null;
  criado_por: string | null;
  created_at: string;
};

export type ContaPagar = {
  id: string;
  fornecedor: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: ContaStatus;
  created_at: string;
};

export type ContaReceber = {
  id: string;
  obra_id: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  status: ContaStatus;
  created_at: string;
};

export type FluxoCaixaMensal = {
  id: string;
  mes: string; // date, first day of the month
  entradas: number;
  saidas: number;
};

export type Documento = {
  id: string;
  nome: string;
  categoria: DocumentoCategoria;
  obra_id: string | null;
  licitacao_id: string | null;
  data_validade: string | null;
  arquivo_url: string | null;
  created_at: string;
};

export type Fornecedor = {
  id: string;
  nome: string;
  categoria: FornecedorCategoria;
  contato: string | null;
  avaliacao: number;
  created_at: string;
};

export type FornecedorCompra = {
  id: string;
  fornecedor_id: string;
  obra_id: string | null;
  valor: number;
  data: string;
};

export type AssistantConversation = {
  id: string;
  user_id: string;
  assistant_key: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type AssistantMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: TableShape<Profile>;
      obras: TableShape<Obra>;
      licitacoes: TableShape<Licitacao>;
      licitacao_checklist: TableShape<LicitacaoChecklist>;
      anexos: TableShape<Anexo>;
      contas_pagar: TableShape<ContaPagar>;
      contas_receber: TableShape<ContaReceber>;
      fluxo_caixa_mensal: TableShape<FluxoCaixaMensal>;
      documentos: TableShape<Documento>;
      fornecedores: TableShape<Fornecedor>;
      fornecedor_compras: TableShape<FornecedorCompra>;
      assistant_conversations: TableShape<AssistantConversation>;
      assistant_messages: TableShape<AssistantMessage>;
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      documento_status: {
        Args: { data_validade: string | null };
        Returns: string;
      };
    };
    Enums: {
      obra_status: ObraStatus;
      licitacao_fase: LicitacaoFase;
      licitacao_resultado: LicitacaoResultado;
      conta_status: ContaStatus;
      documento_categoria: DocumentoCategoria;
      fornecedor_categoria: FornecedorCategoria;
      user_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
