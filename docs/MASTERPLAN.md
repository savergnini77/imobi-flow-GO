# Masterplan — Imobi Flow GO

> **Status (out/2026):** Sprint 1 do Release 1 entregue. As falhas 1–12 do
> diagnóstico foram corrigidas (migrations 0003–0005, 39 testes pgTAP). Auth,
> onboarding, convites (aceite), casca do app, filiais, perfil, dados da
> imobiliária e landing page estão prontos.
> **Pendências do S1:** aplicar as migrations no projeto Supabase de nuvem,
> gerar `src/types/database.ts` e criar os testes E2E (Playwright).
> **Próximo:** Sprint 2 — membros, envio de convites por e-mail, equipes e papéis.

## Contexto

O Imobi Flow GO é um SaaS multiempresa para imobiliárias (Next.js 16 + Supabase). O roadmap colado tem 16 fases em sequência. Ele é sólido do ponto de vista técnico, mas foi pensado como engenharia, e não como produto que precisa vender. Do jeito que está, a cobrança só chega na fase 9, o dashboard na 11 e a captação de leads de portais na 13. Também não existe landing page, importação de planilha nem LGPD.

**Estado real do código hoje (revisão completa do repositório):**

- ✅ Banco núcleo multiempresa bem desenhado: `supabase/migrations/0001_phase0_core.sql` (profiles, companies, roles, permissions, role_permissions, memberships, teams, team_members, invitations, RLS com funções `app.is_member` / `app.has_permission` / `app.is_owner` / `app.shares_company`).
- ✅ RPC `create_company_with_owner`, em `supabase/migrations/0002_auth_provisioning.sql`.
- ✅ Server Actions de auth com Zod e mensagens de erro em PT-BR, em `src/modules/auth/{actions,schema,errors}.ts`, já com testes.
- ✅ Clientes Supabase SSR e proxy de sessão: `src/lib/supabase/{server,session}.ts` e `src/proxy.ts`.
- ❌ Nenhuma tela existe. `src/app/page.tsx` ainda é o template padrão do Next. `layout.tsx` está com `lang="en"` e o título "Create Next App", e o `body` força Arial por cima da Geist.
- ❌ Não existe `supabase/config.toml`, então não há stack local nem testes de RLS.
- ❌ O README e o `.env.example` ainda dizem "Etapa 1, sem Supabase".

**Decisões tomadas com você:** (1) reorganizar em **releases vendáveis**; (2) CRM com **Contato único + Oportunidades**; (3) primeiro bloco de execução: **Fundação + Auth + Landing**.

---

## 1. Diagnóstico — falhas encontradas (corrigir no Sprint 1)

| #   | Gravidade            | Onde                                             | Problema                                                                                                                                                           |
| --- | -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 🔴 Segurança         | `0001` política `memberships_update`             | Quem tem `members.update_role` (o admin) pode se promover a **owner**, rebaixar o owner ou mudar o próprio papel.                                                  |
| 2   | 🔴 Segurança         | `0001` política `memberships_insert`             | Quem tem `members.invite` insere a membership de **qualquer user_id** com **qualquer papel**, inclusive owner, sem passar por convite.                             |
| 3   | 🔴 Segurança         | `0001` política `companies_insert_authenticated` | Qualquer usuário cria uma company direto pela API, sem membership. Isso gera empresas órfãs e permite reservar slugs. A criação deve acontecer só pela RPC.        |
| 4   | 🟠 Integridade       | `memberships_delete`                             | Dá para remover o **último owner**, e a imobiliária fica sem dono.                                                                                                 |
| 5   | 🟠 Funcional         | `role_permissions`, onde toda escrita é negada   | `roles.manage` cria papéis personalizados que não podem receber nenhuma permissão, ou seja, papéis inúteis.                                                        |
| 6   | 🟠 Funcional         | `invitations`                                    | Não existe fluxo de aceite (RPC). O `update` deixaria quem revoga marcar o convite como `accepted`.                                                                |
| 7   | 🟠 Funcional         | `src/modules/auth/actions.ts`                    | Os links de e-mail apontam para `/auth/callback` e `/auth/update-password`, que **não existem**. Hoje a confirmação de cadastro e a recuperação de senha quebram.  |
| 8   | 🟡 Segurança         | seed                                             | O papel `agent` tem `invitations.view` e enxerga e-mails de convidados sem necessidade.                                                                            |
| 9   | 🟡 Segurança         | migrations futuras                               | Falta `alter default privileges ... revoke ... from anon`. Toda tabela nova nasce exposta ao `anon` até alguém lembrar de revogar.                                 |
| 10  | 🟡 Roadmap           | seed                                             | Falta o papel **Gerente (manager)**, que está previsto no roadmap.                                                                                                 |
| 11  | 🟡 Fase 0 incompleta | —                                                | Faltam audit log, company_settings, storage com política por empresa, feature flags/plano, soft delete e provisionamento completo (equipe padrão e configurações). |
| 12  | 🟡 UX/SEO            | `layout.tsx`, `globals.css`                      | `lang`, metadata e fonte incorretos.                                                                                                                               |

---

## 2. Conclusões estratégicas (produto, marketing e vendas)

1. **Vender cedo.** Uma imobiliária paga por **"não perder lead e fechar mais"**. O ciclo de valor é: _lead chega → corretor responde no WhatsApp em minutos → envia imóveis → visita → proposta → fechamento_. O primeiro release tem que entregar esse ciclo inteiro, de forma simples, e já cobrar.
2. **Contato único.** Usar `contacts` (pessoa ou empresa) com `lifecycle_stage` (lead → cliente) e papéis (comprador, locatário, **proprietário**, investidor). Assim nada é duplicado quando um lead vira cliente ou quando um cliente também é proprietário de um imóvel captado. Mantemos a regra **Lead ≠ Negócio** com `opportunities`.
3. **Puxar para o release 1 o que o roadmap deixou tarde:** dashboard simples, trial e Stripe, landing page, **importação CSV** (planilha é o principal concorrente, e a migração precisa ser trivial), uma página pública do imóvel com formulário que cria lead (efeito viral) e LGPD (consentimento, exportação e exclusão).
4. **Captação de portais (Grupo OLX/ZAP/VivaReal) vira o início do R2.** É a principal fonte de leads das imobiliárias no Brasil e um argumento de venda forte.
5. **Mobile-first.** O corretor vive no celular, então o app precisa funcionar a 375px e virar PWA no R2.
6. **WhatsApp só 1:1 (clique para conversar).** Continua sem disparo em massa, como no roadmap. Isso evita banimento de número.
7. **Regra de processo mantida:** fase por fase, com cada item cumprindo a _Definition of Done_ abaixo.

### Definition of Done (vale para toda funcionalidade)

Migration → RLS e teste pgTAP de isolamento → schema Zod → Server Action/query em `src/modules/<x>/` → UI → teste unitário → E2E do caminho feliz → evento no audit/timeline → `lint`, `test` e `build` passando.

---

## 3. Masterplan — releases

### 🚀 R1 — MVP vendável (Sprints 1–6) → lançamento com cobrança

| Sprint | Entrega                                                                                                                                                                                                                          | Fases do roadmap             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **S1** | Endurecimento do banco, fechamento da Fase 0, telas de Auth, onboarding, casca do app, **landing page**                                                                                                                          | 0, 1                         |
| **S2** | Membros, convites por e-mail (Resend), equipes, papéis (matriz de leitura e papéis personalizados), perfil, configurações da imobiliária                                                                                         | 2, 3 (parte)                 |
| **S3** | Catálogos (origens, tags, motivos de perda, tipos de imóvel, finalidades), **Contatos** com preferências e consentimento LGPD, **Timeline** (`activities`), **importação CSV**                                                   | 3, 4, 4.2                    |
| **S4** | **Oportunidades + kanban** do pipeline (arrastar e soltar), funil padrão provisionado, **WhatsApp clique para conversar** com modelos de mensagem e registro na timeline                                                         | 4.1, 7 (parte)               |
| **S5** | **Imóveis** (cadastro, fotos no storage, capa e ordem), proprietários via `contact_roles`, captação, status de publicação, **página pública do imóvel** com formulário que vira lead                                             | 5, 5.1, 5.2                  |
| **S6** | **Agenda** (tarefas e visitas, visão dia/semana), **dashboard simples**, **Stripe** (trial de 14 dias, checkout, webhook, bloqueio de acesso, limites por plano), checklist de produção (Vercel, Supabase prod, Sentry, backups) | 6, 9, 11 (parte), 15 (parte) |

### 📈 R2 — Crescimento

Captação de leads (webhook e e-mail dos portais, formulário do site), distribuição round-robin, por equipe e por região, automações simples (gatilho → condição → ação, com fila no banco e `pg_cron`), e-mail individual com modelos, **feed XML para portais**, sincronização com Google Calendar, notificações no app, PWA e relatórios operacionais. _(Fases 7, 8, 12 parcial, 13)_

### 🤖 R3 — Inteligência

Matching imóvel ↔ contato (primeiro score em SQL, depois IA), copiloto (resumo e próxima ação), geração de descrição de imóvel e anúncio, IA executiva (gargalos do funil) e relatórios gerenciais e de ROI por origem. Provedor de IA atrás de uma interface `src/lib/ai/`. _(Fases 10, 11, 12)_

### 🏢 R4 — Escala

Admin master (super admin, impersonação auditada, bloqueio de conta), observabilidade avançada, API pública e webhooks de saída, WhatsApp Business API oficial, escopo de RLS por equipe, site white-label da imobiliária. _(Fases 13, 14, 15)_

### Modelo de dados-alvo do CRM (referência para S3–S5)

- `contacts` (company_id, kind pessoa/empresa, name, email, phones jsonb, cpf_cnpj, lifecycle_stage, owner_user_id, team_id, source_id, score, consent_at, consent_source, deleted_at)
- `contact_roles` (buyer, tenant, owner, investor) · `contact_preferences` (faixa de orçamento, tipos, bairros, quartos, finalidade) · `contact_tags`
- `pipelines` / `pipeline_stages` (position, probability, is_won/is_lost)
- `opportunities` (contact_id, pipeline_id, stage_id, business_type venda/locação, value, probability, expected_close_at, status aberta/ganha/perdida, lost_reason_id, owner_user_id, team_id)
- `opportunity_properties` (imóveis enviados ou de interesse)
- `properties`, `property_media`, `property_owners` (contact_id, percentual), campos de captação (captured_by, captured_at, commission_pct, exclusive_until)
- `activities`, a timeline única: FKs explícitas e anuláveis para contact, opportunity e property (sem polimorfismo, para manter FK e RLS íntegras), `type` enum, `payload jsonb`, `actor_id`, `occurred_at`
- Toda tabela de negócio leva company_id, timestamps, `deleted_at` e índice `(company_id, …)`.

---

## 4. Sprint 1 — execução detalhada (o que será implementado após a aprovação)

> Antes de escrever código Next: ler `node_modules/next/dist/docs/` (proxy, route handlers, server actions, metadata), conforme o `AGENTS.md`.

### 4.1 Banco — `supabase/migrations/0003_phase0_hardening.sql`

- Remover `companies_insert_authenticated` e revogar `insert` em companies de `authenticated`. A criação passa a acontecer **só via RPC** (corrige 3).
- `memberships`: revogar insert e update diretos e criar RPCs `SECURITY DEFINER` (corrige 1, 2 e 4):
  - `change_member_role(p_membership_id, p_role_id)`: ninguém muda o próprio papel; só um owner atribui ou retira o papel de owner; o último owner fica protegido.
  - `remove_member(p_membership_id)`, mais um trigger `before delete` que impede remover o último owner. Sair da imobiliária também é permitido.
- Convites (corrige 6): `create_invitation(company, email, role)` gera o token no servidor, grava só o SHA-256 e devolve o token puro uma única vez. Não pode convidar como owner sem ser owner. `accept_invitation(p_token)` confere o e-mail de `auth.jwt()`, a validade e o status, cria a membership e marca `accepted`. `revoke_invitation`. O update da política fica restrito a `status → revoked`.
- `role_permissions` (corrige 5): permitir escrita em papéis **não de sistema** com `roles.manage`, sem conceder permissão que o próprio usuário não tem (trigger).
- `alter default privileges in schema public revoke all on tables from anon` (corrige 9).

### 4.2 Banco — `supabase/migrations/0004_phase0_foundation.sql`

- `company_settings` (1:1: timezone `America/Sao_Paulo`, moeda BRL, CRECI, telefone, WhatsApp, logo_path, cor da marca)
- `profiles`: adicionar phone, job_title, preferences jsonb
- `audit_log` (company_id, actor_id, table_name, record_id, action, diff jsonb), com a função genérica `app.audit()` ligada às tabelas do núcleo e leitura restrita a quem tem `audit.view`
- Preparação de billing em `companies`: `plan` (trial/starter/pro/business), `subscription_status`, `trial_ends_at` (now + 14 dias), mais `feature_flags` (por empresa, com override)
- Storage: bucket privado `company-files`, com política de que o caminho começa com `{company_id}/` e o usuário é membro; bucket `avatars` com `{user_id}/`
- `create_company_with_owner` passa a ser `provision_company(p_name)`: gera o slug (com sufixo se houver colisão) e cria em uma única transação a company, a membership de owner, a equipe "Equipe principal" com o owner dentro, `company_settings` e o trial. O pipeline e as etapas padrão entram nessa mesma função no S4.
- Seed (corrige 8 e 10): papel `manager` (Gerente), novas permissões (`audit.view`, `settings.manage`, `billing.manage`) e `invitations.view` removido do `agent`.
- `supabase init`, gerando `supabase/config.toml` (auth local com Mailpit e redirect URLs `http://localhost:3000/auth/callback`)
- Testes pgTAP em `supabase/tests/`: isolamento entre duas empresas, escalada de papel bloqueada, último owner, convite expirado ou com e-mail diferente, criação direta de company bloqueada
- Tipos gerados em `src/types/database.ts` (`supabase gen types`), usados pelos dois clientes Supabase

### 4.3 Auth, onboarding e casca do app

- Base: `src/app/layout.tsx` com `lang="pt-BR"`, metadata real (title template, OG) e fonte Geist (sem Arial). `globals.css` com tokens de marca, claro e escuro. shadcn/ui + lucide-react em `src/components/ui/`.
- Rotas (os caminhos `/auth/*` são os que as actions já usam):
  - `src/app/(auth)/entrar/page.tsx`, `cadastro/page.tsx`, `recuperar-senha/page.tsx`: formulários com react-hook-form e os schemas já existentes em `src/modules/auth/schema.ts`, chamando as actions de `src/modules/auth/actions.ts`
  - `src/app/auth/callback/route.ts`: `exchangeCodeForSession` / `verifyOtp(token_hash)`, depois redireciona para `next` (só caminhos relativos), corrige 7
  - `src/app/auth/update-password/page.tsx`
  - `src/app/onboarding/page.tsx`, com a action `createCompany` em `src/modules/companies/actions.ts` (+ `schema.ts`) chamando `provision_company`
  - `src/app/convite/[token]/page.tsx`, que aceita o convite (a UI de envio fica para o S2)
- Proteção:
  - `src/lib/auth/session.ts`: `getUser()`, `requireUser()`, `requireMembership()`, `getActiveCompany()`. A empresa ativa vem de um cookie **validado contra memberships** e é só contexto, conforme o README.
  - `src/lib/supabase/session.ts` e `src/proxy.ts`: redirecionamento otimista. Sem sessão em rotas `(app)` vai para `/entrar`; com sessão em `/entrar` vai para `/dashboard`. A checagem definitiva acontece no layout do servidor.
  - Fluxo: cadastro → e-mail → callback → sem membership vai para `/onboarding` → `/dashboard`.
- Casca: `src/app/(app)/layout.tsx` com sidebar (Dashboard, Contatos, Oportunidades, Imóveis, Agenda, Configurações; os itens futuros aparecem com o selo "em breve"), topbar com seletor de imobiliária, menu do usuário, sair e o banner "Trial: X dias restantes". Também `(app)/dashboard/page.tsx` com estado vazio e checklist de primeiros passos (completar a imobiliária, convidar a equipe, cadastrar o 1º imóvel, importar contatos).
- Perfil mínimo em `src/app/(app)/settings/profile/page.tsx` (nome, telefone, cargo, foto) e configurações da imobiliária em `settings/company/page.tsx`.

### 4.4 Landing page de vendas — `src/app/(marketing)/`

Substitui o `src/app/page.tsx` padrão. São só Server Components; o JS de cliente fica restrito ao menu mobile e ao acordeão de FAQ. Usa `next/image`, `next/font` e renderização estática.

Estrutura e copy (PT-BR):

1. **Hero:** "Pare de perder lead no WhatsApp." / "O CRM imobiliário que organiza seus contatos, imóveis e visitas em um só lugar, e mostra ao corretor o próximo passo de cada negócio." CTA principal **"Teste grátis por 14 dias"** (sem cartão) e CTA secundário "Ver como funciona". Mockup do kanban.
2. **Dor:** leads espalhados entre WhatsApp, planilha e portais; follow-up esquecido; gestor sem visibilidade.
3. **Solução em 3 pilares:** Atender rápido · Organizar o funil · Fechar mais.
4. **Como funciona em 3 passos:** crie sua imobiliária → importe sua planilha → comece a atender.
5. **Funcionalidades:** contatos e timeline, funil kanban, imóveis com fotos, WhatsApp em um clique, agenda de visitas, equipes e permissões, página do imóvel que gera lead.
6. **Para quem:** corretor autônomo · imobiliária pequena · imobiliária em crescimento.
7. **Preços:** 3 planos (Starter / Pro / Business). Os valores são **proposta a validar com você** e estão centralizados em `src/config/plans.ts`, a mesma fonte que o Stripe vai usar no S6.
8. **Segurança e LGPD:** dados isolados por imobiliária, backups, conformidade com a LGPD.
9. **FAQ**, **CTA final** e rodapé.

- Páginas `termos/page.tsx` e `privacidade/page.tsx` como modelo base, a ser revisado juridicamente.
- SEO: `metadata`, OG image (`opengraph-image.tsx`), JSON-LD `SoftwareApplication`, `sitemap.ts` e `robots.ts`.
- **Sem depoimentos ou números inventados.** A prova social entra como espaço marcado para ser preenchido com clientes reais.
- Meta: Lighthouse ≥ 95 em Performance, Acessibilidade e SEO, mobile a 375px sem scroll horizontal.

### 4.5 Higiene

- README e `.env.example` atualizados (stack local, scripts, fluxo de auth; adicionar `RESEND_API_KEY` e as variáveis do Stripe como placeholders comentados)
- Scripts no `package.json`: `db:start`, `db:reset`, `db:test`, `db:types`, `test:e2e`
- Playwright em `tests/e2e/` e GitHub Actions (`.github/workflows/ci.yml`: lint, test, build, e2e contra o Supabase local)

---

## 5. Verificação (fim do Sprint 1)

1. `npm run lint`, `npm run test` e `npm run build` sem erros.
2. `supabase start`, depois `supabase db reset` (migrations e seed limpos) e `supabase test db` (todos os pgTAP passando, incluindo os casos de escalada de papel e de último owner).
3. E2E com Playwright, usando contas de teste geradas e registradas no fixture: cadastro → e-mail no Mailpit → callback → onboarding → dashboard com trial; logout/login; recuperação de senha completa; usuário sem sessão em `/dashboard` vai para `/entrar`; usuário A não enxerga dados da empresa B.
4. `npm run dev` com o painel de preview: percorrer landing → cadastro → app a 375px e no desktop; rodar o Lighthouse na landing.
5. `get_advisors` do Supabase (segurança e performance) sem alertas críticos.

Ao final de cada sprint: revisão com você antes de avançar para o próximo, como manda a regra do roadmap.
