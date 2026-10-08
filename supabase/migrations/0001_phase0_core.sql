-- =============================================================================
-- Imobi Flow GO — Fase 0 — Migração 0001: núcleo multiempresa
-- =============================================================================
-- Cria: extensões, tipo enum, funções de apoio, tabelas do núcleo, constraints,
-- índices, funções auxiliares de RLS, gatilhos e políticas RLS.
--
-- NÃO insere dados. As permissões, os papéis de sistema e a matriz
-- papel<->permissão são carregados por supabase/seed.sql.
--
-- Convenções:
--  - Toda tabela de dados da imobiliária tem a coluna company_id.
--  - RLS ligada em todas as tabelas do schema public.
--  - Autorização é sempre verificada no banco (memberships + role), nunca a
--    partir de um valor enviado pelo navegador.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensões
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid()
create extension if not exists citext   with schema extensions;   -- e-mail case-insensitive

-- -----------------------------------------------------------------------------
-- Schema privado para as funções auxiliares de RLS (não exposto pela API)
-- -----------------------------------------------------------------------------
create schema if not exists app;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- -----------------------------------------------------------------------------
-- Função de timestamp: mantém updated_at em cada UPDATE
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- TABELAS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — dados do usuário (global, 1 para 1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Dados do usuário. Global: um usuário pode pertencer a várias imobiliárias.';

-- -----------------------------------------------------------------------------
-- companies — a imobiliária (o tenant)
-- -----------------------------------------------------------------------------
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint companies_name_len_ck    check (char_length(btrim(name)) between 2 and 120),
  constraint companies_slug_format_ck check (slug ~ '^[a-z0-9-]+$'),
  constraint companies_slug_uq        unique (slug)
);

comment on table public.companies is 'A imobiliária. Exibida ao usuário como "Imobiliária".';

-- -----------------------------------------------------------------------------
-- roles — papéis (de sistema quando company_id IS NULL)
-- -----------------------------------------------------------------------------
create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references public.companies (id) on delete cascade,
  slug        text not null,
  name        text not null,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint roles_slug_format_ck  check (slug ~ '^[a-z_]+$'),
  constraint roles_is_system_ck    check (is_system = (company_id is null)),
  constraint roles_company_slug_uq unique (company_id, slug)
);

-- papéis de sistema: slug único quando company_id IS NULL
create unique index roles_system_slug_uq on public.roles (slug) where company_id is null;

comment on table public.roles is 'Papéis. company_id NULL = papel de sistema, válido para todas as imobiliárias.';

-- -----------------------------------------------------------------------------
-- permissions — catálogo global de permissões
-- -----------------------------------------------------------------------------
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null,
  description text not null,
  created_at  timestamptz not null default now(),
  constraint permissions_key_format_ck check (key ~ '^[a-z_]+\.[a-z_]+$'),
  constraint permissions_key_uq        unique (key)
);

comment on table public.permissions is 'Catálogo fixo de permissões. Escrita apenas por seed/migração.';

-- -----------------------------------------------------------------------------
-- role_permissions — liga roles <-> permissions
-- -----------------------------------------------------------------------------
create table public.role_permissions (
  id            uuid primary key default gen_random_uuid(),
  role_id       uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at    timestamptz not null default now(),
  constraint role_permissions_uq unique (role_id, permission_id)
);

create index role_permissions_role_id_idx       on public.role_permissions (role_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

comment on table public.role_permissions is 'Matriz papel<->permissão. Escrita apenas por seed/migração; bloqueada pela API.';

-- -----------------------------------------------------------------------------
-- memberships — vínculo usuário <-> imobiliária (com papel)
-- -----------------------------------------------------------------------------
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role_id     uuid not null references public.roles (id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint memberships_company_user_uq unique (company_id, user_id)
);

create index memberships_company_id_idx on public.memberships (company_id);
create index memberships_user_id_idx    on public.memberships (user_id);
create index memberships_role_id_idx    on public.memberships (role_id);

comment on table public.memberships is 'Usuário pertence a uma imobiliária com exatamente um papel.';

-- -----------------------------------------------------------------------------
-- teams — equipes dentro da imobiliária
-- -----------------------------------------------------------------------------
create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint teams_name_len_ck     check (char_length(btrim(name)) between 2 and 80),
  constraint teams_company_name_uq unique (company_id, name),
  constraint teams_id_company_uq   unique (id, company_id)
);

create index teams_company_id_idx on public.teams (company_id);

comment on table public.teams is 'Equipes de uma imobiliária.';

-- -----------------------------------------------------------------------------
-- team_members — liga teams <-> pessoas (sempre da mesma company)
-- -----------------------------------------------------------------------------
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null,
  team_id     uuid not null,
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  constraint team_members_team_company_fk
    foreign key (team_id, company_id) references public.teams (id, company_id) on delete cascade,
  constraint team_members_membership_fk
    foreign key (company_id, user_id) references public.memberships (company_id, user_id) on delete cascade,
  constraint team_members_team_user_uq unique (team_id, user_id)
);

create index team_members_team_id_idx    on public.team_members (team_id);
create index team_members_user_id_idx    on public.team_members (user_id);
create index team_members_company_id_idx on public.team_members (company_id);

comment on table public.team_members is 'Chaves compostas garantem que equipe e pessoa são da mesma imobiliária.';

-- -----------------------------------------------------------------------------
-- invitations — convites pendentes (guarda só o hash do token)
-- -----------------------------------------------------------------------------
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  email       extensions.citext not null,
  role_id     uuid not null references public.roles (id) on delete restrict,
  status      public.invitation_status not null default 'pending',
  token_hash  text not null,
  invited_by  uuid references public.profiles (id) on delete set null,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint invitations_email_format_ck      check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint invitations_token_hash_format_ck check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint invitations_token_hash_uq        unique (token_hash)
);

create index invitations_company_id_idx on public.invitations (company_id);
create index invitations_email_idx      on public.invitations (email);

-- no máximo um convite "pending" por (company_id, email)
create unique index invitations_pending_company_email_uq
  on public.invitations (company_id, email)
  where status = 'pending';

comment on table public.invitations is 'Convite por e-mail. token_hash = SHA-256 (hex) do token; o token puro nunca é armazenado.';

-- =============================================================================
-- FUNÇÕES AUXILIARES DE RLS (schema app)
-- SECURITY DEFINER + search_path fixo => ignoram RLS e evitam recursão.
-- =============================================================================

create or replace function app.is_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.company_id = p_company_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function app.has_permission(p_company_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.company_id = p_company_id
      and m.user_id = (select auth.uid())
      and p.key = p_permission
  );
$$;

create or replace function app.is_owner(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.roles r on r.id = m.role_id
    where m.company_id = p_company_id
      and m.user_id = (select auth.uid())
      and r.company_id is null
      and r.slug = 'owner'
  );
$$;

create or replace function app.shares_company(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships a
    join public.memberships b on b.company_id = a.company_id
    where a.user_id = (select auth.uid())
      and b.user_id = p_user_id
  );
$$;

-- =============================================================================
-- FUNÇÕES DE GATILHO (plpgsql)
-- =============================================================================

-- Cria a linha em profiles quando o Supabase Auth cria um usuário.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Garante que o papel de uma membership/invitation é de sistema ou da mesma company.
create or replace function public.enforce_role_company_match()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_company uuid;
begin
  select company_id into v_role_company
  from public.roles
  where id = new.role_id;

  if v_role_company is not null and v_role_company is distinct from new.company_id then
    raise exception 'papel % não pertence à company %', new.role_id, new.company_id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

-- =============================================================================
-- GATILHOS
-- =============================================================================

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.memberships
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.teams
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.invitations
  for each row execute function public.set_updated_at();

create trigger memberships_role_company_ck
  before insert or update of role_id, company_id on public.memberships
  for each row execute function public.enforce_role_company_match();

create trigger invitations_role_company_ck
  before insert or update of role_id, company_id on public.invitations
  for each row execute function public.enforce_role_company_match();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS — habilitar em todas as tabelas
-- =============================================================================
alter table public.profiles         enable row level security;
alter table public.companies        enable row level security;
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships      enable row level security;
alter table public.teams            enable row level security;
alter table public.team_members     enable row level security;
alter table public.invitations      enable row level security;

-- =============================================================================
-- PRIVILÉGIOS (defesa em profundidade, além das políticas)
-- No Supabase, tabelas novas em public já nascem com privilégios para anon e
-- authenticated; aqui revogamos e concedemos só o necessário.
-- =============================================================================

-- Schema app: só authenticated pode usar; execução das funções idem.
revoke all on schema app from public;
grant usage on schema app to authenticated, service_role;
revoke all on all functions in schema app from public;
grant execute on all functions in schema app to authenticated, service_role;

-- anon não acessa nenhuma tabela de dados da aplicação.
revoke all on all tables in schema public from anon;

-- Tabelas de referência: leitura para authenticated; escrita bloqueada.
revoke all on public.permissions      from authenticated;
grant  select on public.permissions   to authenticated;
revoke all on public.role_permissions from authenticated;
grant  select on public.role_permissions to authenticated;

-- Demais tabelas: CRUD para authenticated (a RLS abaixo é quem de fato restringe).
revoke all on public.profiles    from authenticated;
grant  select, insert, update, delete on public.profiles to authenticated;
revoke all on public.companies   from authenticated;
grant  select, insert, update, delete on public.companies to authenticated;
revoke all on public.roles       from authenticated;
grant  select, insert, update, delete on public.roles to authenticated;
revoke all on public.memberships from authenticated;
grant  select, insert, update, delete on public.memberships to authenticated;
revoke all on public.teams       from authenticated;
grant  select, insert, update, delete on public.teams to authenticated;
revoke all on public.team_members from authenticated;
grant  select, insert, delete on public.team_members to authenticated;
revoke all on public.invitations from authenticated;
grant  select, insert, update, delete on public.invitations to authenticated;

-- =============================================================================
-- POLÍTICAS RLS
-- Padrão: SELECT exige ser membro; escrita exige app.has_permission(company_id, ...).
-- =============================================================================

-- ---------- profiles ----------
create policy profiles_select_self_or_shared on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or app.shares_company(id));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- companies ----------
create policy companies_select_member on public.companies
  for select to authenticated
  using (app.is_member(id));

create policy companies_insert_authenticated on public.companies
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy companies_update_manage on public.companies
  for update to authenticated
  using (app.has_permission(id, 'company.manage'))
  with check (app.has_permission(id, 'company.manage'));

create policy companies_delete_owner on public.companies
  for delete to authenticated
  using (app.is_owner(id) and app.has_permission(id, 'company.delete'));

-- ---------- roles ----------
create policy roles_select on public.roles
  for select to authenticated
  using (company_id is null or app.is_member(company_id));

create policy roles_insert_manage on public.roles
  for insert to authenticated
  with check (company_id is not null and app.has_permission(company_id, 'roles.manage'));

create policy roles_update_manage on public.roles
  for update to authenticated
  using (company_id is not null and app.has_permission(company_id, 'roles.manage'))
  with check (company_id is not null and app.has_permission(company_id, 'roles.manage'));

create policy roles_delete_manage on public.roles
  for delete to authenticated
  using (company_id is not null and is_system = false and app.has_permission(company_id, 'roles.manage'));

-- ---------- permissions ----------
create policy permissions_select_all on public.permissions
  for select to authenticated
  using (true);
-- sem políticas de escrita => INSERT/UPDATE/DELETE negados pela API

-- ---------- role_permissions ----------
-- LEITURA: só se o papel-pai for visível ao usuário
create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (
    exists (
      select 1
      from public.roles r
      where r.id = role_permissions.role_id
        and (r.company_id is null or app.is_member(r.company_id))
    )
  );

-- ESCRITA: sempre negada pela API (dados de referência)
create policy role_permissions_no_insert on public.role_permissions
  for insert to authenticated, anon
  with check (false);

create policy role_permissions_no_update on public.role_permissions
  for update to authenticated, anon
  using (false)
  with check (false);

create policy role_permissions_no_delete on public.role_permissions
  for delete to authenticated, anon
  using (false);

-- ---------- memberships ----------
create policy memberships_select on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or app.is_member(company_id));

create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (app.has_permission(company_id, 'members.invite'));

create policy memberships_update on public.memberships
  for update to authenticated
  using (app.has_permission(company_id, 'members.update_role'))
  with check (app.has_permission(company_id, 'members.update_role'));

create policy memberships_delete on public.memberships
  for delete to authenticated
  using (app.has_permission(company_id, 'members.remove'));

-- ---------- teams ----------
create policy teams_select on public.teams
  for select to authenticated
  using (app.is_member(company_id));

create policy teams_insert on public.teams
  for insert to authenticated
  with check (app.has_permission(company_id, 'teams.create'));

create policy teams_update on public.teams
  for update to authenticated
  using (app.has_permission(company_id, 'teams.update'))
  with check (app.has_permission(company_id, 'teams.update'));

create policy teams_delete on public.teams
  for delete to authenticated
  using (app.has_permission(company_id, 'teams.delete'));

-- ---------- team_members ----------
create policy team_members_select on public.team_members
  for select to authenticated
  using (app.is_member(company_id));

create policy team_members_insert on public.team_members
  for insert to authenticated
  with check (app.has_permission(company_id, 'teams.manage_members'));

create policy team_members_delete on public.team_members
  for delete to authenticated
  using (app.has_permission(company_id, 'teams.manage_members'));

-- ---------- invitations ----------
create policy invitations_select on public.invitations
  for select to authenticated
  using (app.has_permission(company_id, 'invitations.view'));

create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (
    app.has_permission(company_id, 'invitations.create')
    and invited_by = (select auth.uid())
  );

create policy invitations_update on public.invitations
  for update to authenticated
  using (app.has_permission(company_id, 'invitations.revoke'))
  with check (app.has_permission(company_id, 'invitations.revoke'));

create policy invitations_delete on public.invitations
  for delete to authenticated
  using (app.has_permission(company_id, 'invitations.revoke'));

-- =============================================================================
-- Fim da migração 0001.
-- =============================================================================
