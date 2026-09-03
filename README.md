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
| `/fornecedores` | Fornecedores  | Todos (cadastro, compras, anexos)        |
| `/usuarios`     | Usuários      | **Somente administradores** (criar / promover / remover) |

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
3. `supabase/migrations/0003_hardening.sql` — hardening (search_path, revoke RPC)
4. `supabase/migrations/0004_licitacao_arquivos.sql` — (supersedida pela 0005)
5. `supabase/migrations/0005_anexos.sql` — anexos genéricos (bucket + tabela `anexos`)
6. `supabase/migrations/0006_anexos_fornecedor.sql` + `0007_*` — escopo `fornecedor`
7. `supabase/seed.sql` — dados de demonstração (opcional, extraídos dos protótipos)

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

Sem `NEXT_PUBLIC_SUPABASE_*` o app roda em modo demonstração (ver acima).
Sem `ANTHROPIC_API_KEY` os assistentes respondem com um aviso de configuração.

### 4. Primeiro usuário / administrador

Em **Authentication → Users → Add user** crie a conta (marque **Auto Confirm
User**). Um registro em `public.profiles` é criado automaticamente com
`role = 'user'`. Para torná-lo administrador:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users order by created_at desc limit 1);
```

A partir daí, os demais usuários são criados **dentro do sistema** em
`/usuarios` (só admin) — sem voltar ao painel do Supabase. Isso exige a
`SUPABASE_SERVICE_ROLE_KEY` configurada (item 3).

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

## Deploy na Vercel

1. **Importar** o repositório em [vercel.com/new](https://vercel.com/new).
   O Next.js é detectado sozinho — não precisa mexer em build command,
   output nem `vercel.json`. Node 20+ (definido em `package.json → engines`).

2. **Variáveis de ambiente** (Project → Settings → Environment Variables).
   Adicione **antes do primeiro build** — as `NEXT_PUBLIC_*` são embutidas no
   bundle em tempo de build; se adicionar depois, faça *Redeploy*.

   | Variável | Ambiente | Observação |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Supabase → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | idem |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production | server-only; necessária para a tela `/usuarios` |
   | `ANTHROPIC_API_KEY` | Production, Preview | console.anthropic.com |
   | `ANTHROPIC_MODEL` | opcional | padrão `claude-opus-5` |

3. **Supabase → Authentication → URL Configuration**
   - *Site URL*: `https://<seu-projeto>.vercel.app`
   - *Redirect URLs*: adicione `https://<seu-projeto>.vercel.app/auth/callback`
     (e a URL de cada Preview, se for usar magic link / recuperação de senha).

4. **Aplicar migrations + seed** no projeto Supabase de produção
   (SQL Editor ou `supabase db push`), e criar o primeiro usuário `admin`
   (ver seção anterior).

> **Atenção:** se publicar **sem** as variáveis do Supabase, o site vai ao ar em
> **modo demonstração** — acessível publicamente, sem login, com dados fictícios.
> Configure o Supabase antes de divulgar a URL, ou ligue a proteção por senha da
> Vercel (Settings → Deployment Protection) enquanto isso.

O endpoint dos assistentes (`/api/assistants/chat`) roda no runtime Node com
`maxDuration = 60` (limite do plano Hobby). No plano Pro dá para aumentar.

## Estrutura

```
app/
  (app)/                 layout com nav + barra de assistentes; telas dos módulos
    usuarios/            gestão de equipe (admin) — page + server actions
  login/                 tela de login (email/senha)
  auth/callback|signout  rotas de sessão Supabase
  api/assistants/chat    streaming da resposta da IA + persistência do histórico
components/               nav, barra de assistentes, painel de chat, UI primitives
lib/
  supabase/              clients browser/server/admin + middleware de sessão
  queries.ts             acesso a dados por módulo (server-only)
  users.ts               listagem de usuários (auth.users + profiles, server-only)
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
