# Imobi Flow GO

SaaS para imobiliárias (multi-empresa). Cada imobiliária usa o mesmo sistema com
os dados isolados por empresa.

> **Status:** Etapa 1 concluída — apenas a base do projeto (Next.js + TypeScript +
> Tailwind + ESLint + Prettier + estrutura de pastas). Ainda **não** há Supabase,
> banco de dados, autenticação nem telas.

---

## Tecnologias

| Camada        | Ferramenta              |
| ------------- | ----------------------- |
| Framework     | Next.js 16 (App Router) |
| Linguagem     | TypeScript              |
| Estilo        | Tailwind CSS v4         |
| Padrão código | ESLint + Prettier       |
| Pacotes       | npm                     |

Planejado para as próximas etapas: Supabase (PostgreSQL, Auth, Storage, RLS),
shadcn/ui, React Hook Form + Zod, TanStack Query, Vitest e Playwright.

---

## Pré-requisitos

- **Node.js 20.9 ou superior** (recomendado: Node 22 LTS ou 24). Verifique com:
  ```bash
  node --version
  ```
- **npm 10+** (vem junto com o Node).
- **Git** (opcional nesta etapa; necessário para versionar o projeto).

No Windows, se `node` não for reconhecido no terminal após instalar, feche e
reabra o terminal para o PATH atualizar.

---

## Como rodar localmente

1. Entre na pasta do projeto:

   ```bash
   cd imobi-flow-go
   ```

2. Instale as dependências (só na primeira vez ou quando o `package.json` mudar):

   ```bash
   npm install
   ```

3. Variáveis de ambiente:

   Nesta Etapa 1 **não é necessário** configurar nada para rodar. Quando for
   preciso (etapas futuras), copie o modelo:

   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env.local

   # Linux / macOS
   cp .env.example .env.local
   ```

   O arquivo `.env.local` é ignorado pelo Git. Nunca coloque chaves reais em
   `.env.example`.

4. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abra no navegador: <http://localhost:3000>

   A página recarrega sozinha ao salvar arquivos.

---

## Scripts disponíveis

| Comando                | O que faz                                                      |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Sobe o servidor de desenvolvimento em `http://localhost:3000`. |
| `npm run build`        | Gera a versão de produção.                                     |
| `npm run start`        | Roda a versão de produção já compilada (após `build`).         |
| `npm run lint`         | Verifica problemas de código com o ESLint.                     |
| `npm run format`       | Formata todos os arquivos com o Prettier.                      |
| `npm run format:check` | Só confere se está formatado, sem alterar (útil em CI).        |

---

## Estrutura de pastas

Pastas ainda vazias contêm um arquivo `.gitkeep` com uma linha explicando seu
propósito. Elas serão preenchidas nas próximas etapas.

```
imobi-flow-go/
├─ public/                     # arquivos estáticos
├─ supabase/
│  └─ migrations/              # migrações SQL do banco (vazio nesta etapa)
├─ tests/
│  ├─ e2e/                     # testes ponta a ponta (Playwright)
│  └─ unit/                    # testes de unidade (Vitest)
├─ src/
│  ├─ app/                     # rotas (App Router)
│  │  ├─ (auth)/               # login, cadastro, recuperar senha
│  │  ├─ (app)/                # área logada
│  │  │  ├─ dashboard/
│  │  │  └─ settings/
│  │  │     ├─ members/        # usuários da imobiliária
│  │  │     ├─ teams/          # equipes
│  │  │     └─ roles/          # papéis e permissões
│  │  ├─ api/                  # Route Handlers
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ modules/                 # regra de negócio por assunto
│  │  ├─ companies/            # imobiliária = "company" / company_id (tenant)
│  │  ├─ members/              # vínculo usuário ↔ imobiliária (memberships)
│  │  ├─ teams/
│  │  ├─ permissions/          # papéis, permissões e checagem de acesso
│  │  └─ auth/
│  ├─ components/
│  │  ├─ ui/                   # componentes de base (shadcn/ui)
│  │  └─ shared/               # componentes do produto
│  ├─ lib/
│  │  ├─ supabase/             # clients do Supabase (etapa futura)
│  │  ├─ auth/                 # sessão e contexto da imobiliária ativa
│  │  └─ utils/
│  ├─ hooks/
│  ├─ types/
│  └─ config/
├─ .env.example                # modelo de variáveis (sem chaves reais)
├─ .prettierrc.json
├─ eslint.config.mjs
└─ package.json
```

---

## Convenções

### Nome do tenant

No **código e no banco**, a imobiliária é chamada de **`company`** (tabela
`companies`, coluna `company_id`). Na **interface para o usuário**, o termo
exibido é sempre **"Imobiliária"**.

### Imobiliária ativa

A imobiliária ativa é **apenas contexto de navegação** (qual empresa o usuário
está visualizando na tela). Ela **não** é fonte de autorização.

Toda checagem de permissão e todo acesso a dados devem ser validados **no banco**
(via RLS e verificação de `membership`/`role`). O sistema nunca confia apenas em
um valor de "empresa atual" enviado pelo navegador.

### Formato de cada módulo

Cada pasta em `src/modules/` seguirá o mesmo formato nas próximas etapas:

```
modules/<assunto>/
├─ actions.ts    # ações de escrita (Server Actions / Route Handlers)
├─ queries.ts    # leituras
├─ schema.ts     # validação com Zod
└─ types.ts      # tipos do domínio
```

---

## Próximas etapas (resumo)

1. **Etapa 1 — Base do projeto.** ✅ _(concluída)_
2. Configurar Supabase (nuvem + CLI local) e conectar ao Next.js.
3. Modelo de dados base: `companies`, `profiles`, `memberships`, `teams`,
   `team_members`, `roles`, `permissions`, `invitations`.
4. RLS + funções auxiliares e teste de isolamento entre imobiliárias.
5. Autenticação (cadastro, login, criação da imobiliária).
6. Casca do app (layout, rotas protegidas, seletor de imobiliária).
7. Telas de membros, equipes e permissões.
8. Convites por e-mail.
9. Storage com políticas por imobiliária.
10. Seeds, testes e CI.
11. Deploy (Vercel + Supabase).
