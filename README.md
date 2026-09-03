# ERP Petrus Soluções

Sistema interno da Petrus Soluções (construção civil). Next.js (App Router) +
Supabase (Postgres, Auth, RLS) + assistentes de IA (API da Anthropic).

## Módulos

| Rota            | Módulo        | Acesso                                   |
| --------------- | ------------- | ---------------------------------------- |
| `/painel`       | Painel geral  | Todos                                    |
| `/obras`        | Obras         | Todos (leitura + escrita)                |
| `/licitacoes`   | Licitações    | Todos (leitura + escrita)                |
| `/financeiro`   | Financeiro    | **Somente administradores**              |
| `/documentos`   | Documentos    | Todos leem; só admin edita/exclui        |
| `/fornecedores` | Fornecedores  | Todos (leitura + escrita)                |

Barra fixa de **5 assistentes de IA** à direita em todas as telas
(Análise de Edital, Engenheiro de Planilhas, Auditor de Habilitação,
Redator Ninja, Balanço).

## Stack

- **Next.js 15** / React 19 — App Router, Server Components
- **Supabase** — Postgres + Auth (cookie/SSR) + Row Level Security
- **Tailwind CSS v4** — design system em `app/globals.css` (tema escuro)
- **@anthropic-ai/sdk** — um assistente = um system prompt + histórico por usuário
- Deploy alvo: **Vercel**

## Ver rodando agora (modo demonstração)

Sem configurar nada:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Enquanto o Supabase não estiver configurado, o
site roda em **modo demonstração**: dados fictícios em memória
([lib/demo-data.ts](lib/demo-data.ts), espelham o `seed.sql`), sem login e com
papel de administrador — todas as 6 telas ficam navegáveis. Um aviso no topo
lembra que é demonstração. Os assistentes de IA respondem com um aviso até a
`ANTHROPIC_API_KEY` ser definida.

Preencher `NEXT_PUBLIC_SUPABASE_*` no `.env.local` já troca automaticamente para
o modo real (com login e RLS).

## Rodando com Supabase

### 1. Dependências

```bash
npm install
```

### 2. Supabase

Crie um projeto em [app.supabase.com](https://app.supabase.com). Em
**Project Settings → API** copie a URL e a `anon` key.

Aplique o schema (SQL Editor do dashboard, ou `supabase db push` com a CLI):

1. `supabase/migrations/0001_schema.sql` — tabelas, enums, triggers, `is_admin()`
2. `supabase/migrations/0002_rls.sql` — RLS de todos os módulos
3. `supabase/seed.sql` — dados de demonstração (opcional, extraídos dos protótipos)

> Com a Supabase CLI: `supabase db reset` aplica migrations + seed de uma vez.

### 3. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha:

| Variável                        | Onde obter                                   |
| ------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Settings → API                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Settings → API (server-only, opc.) |
| `ANTHROPIC_API_KEY`             | console.anthropic.com → API Keys             |
| `ANTHROPIC_MODEL`               | opcional, padrão `claude-opus-5`             |

Sem `NEXT_PUBLIC_SUPABASE_*` o app sobe e mostra uma tela de setup.
Sem `ANTHROPIC_API_KEY` os assistentes respondem com um aviso de configuração.

### 4. Primeiro usuário / administrador

Em **Authentication → Users → Add user** crie a conta. Um registro em
`public.profiles` é criado automaticamente com `role = 'user'`. Para torná-lo
administrador (acesso ao Financeiro):

```sql
update public.profiles set role = 'admin' where id = '<uuid-do-usuario>';
```

### 5. Rodar

```bash
npm run dev
```

`http://localhost:3000` → redireciona para `/painel` (ou `/login`).

## Scripts

| Comando             | Ação                                    |
| ------------------- | --------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento            |
| `npm run build`     | Build de produção                      |
| `npm start`         | Servir o build                         |
| `npm run typecheck` | `tsc --noEmit`                          |
| `npm run lint`      | ESLint (`next lint`)                    |

## Estrutura

```
app/
  (app)/                 layout com nav + barra de assistentes; telas dos 6 módulos
  login/                 tela de login (email/senha)
  auth/callback|signout  rotas de sessão Supabase
  api/assistants/chat    streaming da resposta da IA + persistência do histórico
components/               nav, barra de assistentes, painel de chat, UI primitives
lib/
  supabase/              clients browser/server + middleware de sessão
  queries.ts             acesso a dados por módulo (server-only)
  assistants.ts          os 5 assistentes + system prompts
  modules.ts             navegação + cor de destaque por módulo
  format.ts              formatação pt-BR (moeda, datas, %)
  database.types.ts      tipos do schema (regerar com `supabase gen types`)
supabase/
  migrations/            0001 schema · 0002 RLS
  seed.sql               dados de demonstração
```

## Notas de segurança

- As regras de acesso vivem no **banco** (RLS), não só no frontend. O
  `middleware.ts` apenas redireciona não-autenticados para `/login`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca é exposta ao browser (só em
  `lib/supabase/server.ts → createAdminClient`).
- Cada usuário só enxerga as próprias conversas com os assistentes (RLS em
  `assistant_conversations` / `assistant_messages`).

## Protótipos

Os HTML estáticos originais (`painel-geral.html`, `licitacoes.html`, …) foram a
fonte de verdade para layout, cores e componentes. O design system extraído
está em `app/globals.css` (`@theme`).
