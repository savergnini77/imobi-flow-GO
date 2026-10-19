# Imobi Flow GO

CRM SaaS para imobiliárias e corretores (multiempresa). Cada imobiliária usa o
mesmo sistema, com os dados isolados por empresa **no banco de dados** (RLS).

> **Status:** Release 1 · Sprint 1 concluído — fundação segura do banco, auth
> completa, onboarding, casca do app, filiais, perfil, dados da imobiliária e
> landing page de vendas. Plano completo em [`docs/MASTERPLAN.md`](docs/MASTERPLAN.md).

---

## Tecnologias

| Camada      | Ferramenta                                                    |
| ----------- | ------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack, `proxy.ts`)                |
| Linguagem   | TypeScript                                                    |
| Estilo      | Tailwind CSS v4 (tokens em `src/app/globals.css`)             |
| Banco/Auth  | Supabase (PostgreSQL + Auth + Storage + RLS)                  |
| Formulários | React Hook Form + Zod (mesmo schema no cliente e no servidor) |
| Testes      | Vitest (unidade) + pgTAP (RLS / segurança)                    |
| CI          | GitHub Actions (`.github/workflows/ci.yml`)                   |

---

## Como rodar localmente

Pré-requisitos: **Node.js 20.9+** (recomendado 22 LTS) e, para o banco local,
**Docker** (usado pelo Supabase CLI).

```bash
npm install
cp .env.example .env.local      # Windows: Copy-Item .env.example .env.local
npm run db:start                # sobe Supabase local, aplica migrations + seed
# copie a "API URL" e a "anon key" exibidas para o .env.local
npm run dev                     # http://localhost:3000
```

- E-mails locais (confirmação, recuperação de senha) chegam no Mailpit:
  <http://localhost:54324>.
- Usando um projeto Supabase na nuvem: aplique `supabase/migrations/*` em ordem
  e depois `supabase/seed.sql`; em Authentication > URL Configuration, adicione
  `<APP_URL>/auth/callback` às Redirect URLs.

## Scripts

| Comando                  | O que faz                                              |
| ------------------------ | ------------------------------------------------------ |
| `npm run dev`            | Servidor de desenvolvimento                            |
| `npm run check`          | lint + tipos + testes + build (rode antes de commitar) |
| `npm run test`           | Testes de unidade (Vitest)                             |
| `npm run db:start`       | Supabase local (Docker)                                |
| `npm run db:reset`       | Recria o banco local (migrations + seed)               |
| `npm run db:test`        | Testes pgTAP de isolamento e permissões                |
| `npm run db:types`       | Gera `src/types/database.ts` a partir do banco local   |
| `npm run check:supabase` | Testa a conexão com o Supabase do `.env.local`         |

---

## Fluxo do usuário

```
Landing (/) ─► /cadastrar ─► e-mail ─► /auth/callback ─► /onboarding ─► /dashboard
                                                           (provision_company)
/entrar?next=… ─► volta para a página pedida
/convite/<token> ─► aceitar convite ─► /dashboard da imobiliária convidada
```

`provision_company` cria, em uma transação: imobiliária → owner → filial
**Matriz** → **Equipe principal** → configurações → **trial de 14 dias**.

## Banco de dados

| Migração                 | Conteúdo                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `0001_phase0_core`       | Núcleo multiempresa: companies, profiles, memberships, roles, permissions, teams, invitations, RLS                                  |
| `0002_auth_provisioning` | RPC inicial de criação de imobiliária (substituída na 0004)                                                                         |
| `0003_phase0_hardening`  | Correções de segurança: escrita de membros/convites só via RPC, proteção do último owner, papéis personalizados, privilégios padrão |
| `0004_phase0_foundation` | company_settings, plano/trial, feature flags, audit_log, Storage, `provision_company`                                               |
| `0005_locations`         | Filiais (matriz única, lotação de pessoas, equipes por filial)                                                                      |

Testes de segurança: `supabase/tests/database/01_tenant_security.test.sql`.

## Convenções

- **Tenant:** no código e no banco é `company` / `company_id`; na interface é
  sempre **"Imobiliária"**.
- **Imobiliária ativa** é só contexto de navegação (cookie validado contra as
  memberships). Toda autorização acontece no banco (RLS + `app.has_permission`).
- **Escritas sensíveis só por RPC** (`SECURITY DEFINER`, `search_path` vazio):
  papéis, remoção de membros, convites e provisionamento.
- **UPDATE bloqueado pela RLS afeta 0 linhas sem erro:** toda Server Action de
  escrita usa `.select()` e confere se alguma linha voltou.
- **Erros nunca vazam do banco para a tela:** cada módulo tem `errors.ts`
  traduzindo códigos para PT-BR.
- **Formato de módulo:** `src/modules/<assunto>/{actions,queries,schema,errors,types}.ts`.
- **Definition of Done:** migration → RLS + teste pgTAP → schema Zod → action/query
  → UI → teste unitário → `npm run check` verde.
