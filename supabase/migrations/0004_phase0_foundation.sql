-- =============================================================================
-- Imobi Flow GO — Fase 0 — Migração 0004: fundação do SaaS
-- =============================================================================
-- Completa a Fase 0:
--  - profiles: telefone, cargo e preferências
--  - company_settings: configurações da imobiliária (1:1)
--  - companies: plano, status de assinatura e trial (preparação de billing)
--  - feature flags (globais + override por imobiliária)
--  - audit_log + gatilho genérico de auditoria
--  - Storage: buckets e políticas por imobiliária / por usuário
--  - provision_company: provisionamento completo em uma transação
--    (substitui create_company_with_owner)
--
-- Telefones são gravados só com dígitos (DDD + número: 10 ou 11 dígitos),
-- no mesmo padrão de public.locations.
-- =============================================================================

-- =============================================================================
-- PROFILES
-- =============================================================================
alter table public.profiles
  add column if not exists phone       text,
  add column if not exists job_title   text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_full_name_len_ck,
  add constraint profiles_full_name_len_ck check (full_name is null or char_length(full_name) <= 120),
  drop constraint if exists profiles_phone_ck,
  add constraint profiles_phone_ck         check (phone is null or phone ~ '^[0-9]{10,11}$'),
  drop constraint if exists profiles_job_title_len_ck,
  add constraint profiles_job_title_len_ck check (job_title is null or char_length(job_title) <= 80),
  drop constraint if exists profiles_preferences_obj_ck,
  add constraint profiles_preferences_obj_ck check (jsonb_typeof(preferences) = 'object');

-- O usuário só pode editar campos de perfil (nunca o id).
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, phone, job_title, preferences) on public.profiles to authenticated;

-- =============================================================================
-- COMPANIES — plano e assinatura
-- =============================================================================
alter table public.companies
  add column if not exists plan                text not null default 'trial',
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at       timestamptz default (now() + interval '14 days');

alter table public.companies
  drop constraint if exists companies_plan_ck,
  add constraint companies_plan_ck
    check (plan in ('trial', 'starter', 'pro', 'business')),
  drop constraint if exists companies_subscription_status_ck,
  add constraint companies_subscription_status_ck
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'blocked'));

-- Plano e assinatura só mudam pelo backend (webhook de billing / service_role).
revoke update on public.companies from authenticated;
grant update (name) on public.companies to authenticated;

-- =============================================================================
-- COMPANY_SETTINGS — 1:1 com companies
-- =============================================================================
create table if not exists public.company_settings (
  company_id   uuid primary key references public.companies (id) on delete cascade,
  legal_name   text,
  document     text,          -- CNPJ (14) ou CPF (11), só dígitos
  creci        text,
  email        extensions.citext,
  phone        text,
  whatsapp     text,
  website      text,
  timezone     text not null default 'America/Sao_Paulo',
  currency     text not null default 'BRL',
  locale       text not null default 'pt-BR',
  brand_color  text not null default '#047857',
  logo_path    text,
  address      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint company_settings_legal_name_len_ck check (legal_name is null or char_length(legal_name) <= 160),
  constraint company_settings_document_ck       check (document is null or document ~ '^([0-9]{11}|[0-9]{14})$'),
  constraint company_settings_creci_len_ck      check (creci is null or char_length(creci) <= 30),
  constraint company_settings_email_ck          check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  constraint company_settings_phone_ck          check (phone is null or phone ~ '^[0-9]{10,11}$'),
  constraint company_settings_whatsapp_ck       check (whatsapp is null or whatsapp ~ '^[0-9]{10,11}$'),
  constraint company_settings_website_len_ck    check (website is null or char_length(website) <= 200),
  constraint company_settings_brand_color_ck    check (brand_color ~ '^#[0-9a-fA-F]{6}$'),
  constraint company_settings_currency_ck       check (currency ~ '^[A-Z]{3}$'),
  constraint company_settings_address_obj_ck    check (jsonb_typeof(address) = 'object')
);

comment on table public.company_settings is 'Configurações da imobiliária (1:1). Criada pelo provisionamento.';

drop trigger if exists set_updated_at on public.company_settings;
create trigger set_updated_at before update on public.company_settings
  for each row execute function public.set_updated_at();

alter table public.company_settings enable row level security;

revoke all on public.company_settings from anon, authenticated;
grant select on public.company_settings to authenticated;
grant update (
  legal_name, document, creci, email, phone, whatsapp, website,
  timezone, brand_color, logo_path, address
) on public.company_settings to authenticated;

create policy company_settings_select on public.company_settings
  for select to authenticated
  using (app.is_member(company_id));

create policy company_settings_update on public.company_settings
  for update to authenticated
  using (app.has_permission(company_id, 'settings.manage'))
  with check (app.has_permission(company_id, 'settings.manage'));

-- =============================================================================
-- FEATURE FLAGS
-- =============================================================================
create table if not exists public.feature_flags (
  key             text primary key,
  description     text not null,
  default_enabled boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint feature_flags_key_format_ck check (key ~ '^[a-z_]+([.][a-z_]+)*$')
);

create table if not exists public.company_feature_flags (
  company_id  uuid not null references public.companies (id) on delete cascade,
  flag_key    text not null references public.feature_flags (key) on delete cascade,
  enabled     boolean not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (company_id, flag_key)
);

create index if not exists company_feature_flags_flag_key_idx on public.company_feature_flags (flag_key);

drop trigger if exists set_updated_at on public.company_feature_flags;
create trigger set_updated_at before update on public.company_feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags         enable row level security;
alter table public.company_feature_flags enable row level security;

revoke all on public.feature_flags, public.company_feature_flags from anon, authenticated;
grant select on public.feature_flags, public.company_feature_flags to authenticated;

create policy feature_flags_select on public.feature_flags
  for select to authenticated
  using (true);

create policy company_feature_flags_select on public.company_feature_flags
  for select to authenticated
  using (app.is_member(company_id));

-- A flag está ativa para a imobiliária? (override > padrão)
create or replace function public.is_feature_enabled(p_company_id uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select app.is_member(p_company_id) and coalesce(
    (select cf.enabled from public.company_feature_flags cf
      where cf.company_id = p_company_id and cf.flag_key = p_key),
    (select f.default_enabled from public.feature_flags f where f.key = p_key),
    false
  );
$$;

revoke execute on function public.is_feature_enabled(uuid, text) from public;
grant  execute on function public.is_feature_enabled(uuid, text) to authenticated;

-- =============================================================================
-- AUDIT LOG
-- =============================================================================
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  company_id  uuid references public.companies (id) on delete set null,
  actor_id    uuid,          -- sem FK: o registro sobrevive à exclusão do usuário
  table_name  text not null,
  record_id   uuid,
  action      text not null,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz not null default now(),
  constraint audit_log_action_ck check (action in ('insert', 'update', 'delete'))
);

create index if not exists audit_log_company_created_idx on public.audit_log (company_id, created_at desc);
create index if not exists audit_log_record_idx          on public.audit_log (table_name, record_id);

comment on table public.audit_log is 'Trilha de auditoria. Escrita apenas pelo gatilho app.audit().';

alter table public.audit_log enable row level security;

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (company_id is not null and app.has_permission(company_id, 'audit.view'));

-- Gatilho genérico: grava antes/depois, sem campos sensíveis.
create or replace function app.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old     jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new     jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_row     jsonb := coalesce(v_new, v_old);
  v_company uuid;
begin
  v_old := v_old - 'token_hash';
  v_new := v_new - 'token_hash';

  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  v_company := case
    when tg_table_name = 'companies' then (v_row ->> 'id')::uuid
    else (v_row ->> 'company_id')::uuid
  end;

  -- Exclusão em cascata da imobiliária: o registro fica sem company.
  if v_company is not null
     and not exists (select 1 from public.companies c where c.id = v_company) then
    v_company := null;
  end if;

  insert into public.audit_log (company_id, actor_id, table_name, record_id, action, old_data, new_data)
  values (
    v_company,
    (select auth.uid()),
    tg_table_name,
    -- company_settings não tem coluna id: usa company_id.
    coalesce(v_row ->> 'id', v_row ->> 'company_id')::uuid,
    lower(tg_op),
    v_old,
    v_new
  );

  return null;
end;
$$;

revoke all on function app.audit() from public;

do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'company_settings', 'memberships', 'roles',
    'teams', 'team_members', 'invitations'
  ]
  loop
    execute format('drop trigger if exists audit on public.%I', t);
    execute format(
      'create trigger audit after insert or update or delete on public.%I
         for each row execute function app.audit()', t);
  end loop;
end;
$$;

-- =============================================================================
-- STORAGE
-- =============================================================================
-- company-files: privado. Caminho obrigatório: {company_id}/...
-- avatars:       leitura pública. Caminho obrigatório: {user_id}/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('company-files', 'company-files', false, 20971520, null),
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists company_files_select on storage.objects;
drop policy if exists company_files_insert on storage.objects;
drop policy if exists company_files_update on storage.objects;
drop policy if exists company_files_delete on storage.objects;
drop policy if exists avatars_insert on storage.objects;
drop policy if exists avatars_update on storage.objects;
drop policy if exists avatars_delete on storage.objects;

create policy company_files_select on storage.objects
  for select to authenticated
  using (bucket_id = 'company-files'
         and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy company_files_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'company-files'
              and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy company_files_update on storage.objects
  for update to authenticated
  using (bucket_id = 'company-files'
         and app.is_member(app.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'company-files'
              and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy company_files_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'company-files'
         and app.is_member(app.try_uuid((storage.foldername(name))[1])));

create policy avatars_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =============================================================================
-- PROVISIONAMENTO
-- =============================================================================

-- Gera um slug a partir do nome: minúsculas, sem acentos, só [a-z0-9-].
create or replace function app.slugify(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    nullif(
      left(
        btrim(
          regexp_replace(
            translate(
              lower(coalesce(p_value, '')),
              'áàâãäåéèêëíìîïóòôõöúùûüçñý',
              'aaaaaaeeeeiiiiooooouuuucny'
            ),
            '[^a-z0-9]+', '-', 'g'
          ),
          '-'
        ),
        48
      ),
      ''
    ),
    'imobiliaria'
  );
$$;

revoke all on function app.slugify(text) from public;
grant execute on function app.slugify(text) to authenticated, service_role;

-- provision_company — cria a imobiliária completa para o usuário autenticado:
--   company → membership (owner) → equipe padrão → company_settings → trial.
-- Regra atual: cada usuário pode CRIAR uma imobiliária (pode ser convidado
-- para outras). A 0005 acrescenta a filial "Matriz"; o pipeline padrão entra
-- na fase de CRM.
create or replace function public.provision_company(p_name text)
returns public.companies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_name       text := btrim(coalesce(p_name, ''));
  v_base_slug  text;
  v_slug       text;
  v_suffix     integer := 1;
  v_owner_role uuid;
  v_company    public.companies;
  v_team_id    uuid;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'o nome da imobiliária deve ter entre 2 e 120 caracteres'
      using errcode = '22023';
  end if;

  -- O perfil é criado pelo gatilho de auth; garante a existência por segurança.
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;

  if exists (select 1 from public.companies c where c.created_by = v_uid) then
    raise exception 'você já criou uma imobiliária' using errcode = 'P0001';
  end if;

  select r.id into v_owner_role
  from public.roles r
  where r.company_id is null and r.slug = 'owner';

  if v_owner_role is null then
    raise exception 'papel de sistema "owner" não encontrado — rode o seed'
      using errcode = 'P0001';
  end if;

  -- Slug único: nome-da-imobiliaria, nome-da-imobiliaria-2, ...
  v_base_slug := app.slugify(v_name);
  v_slug := v_base_slug;
  while exists (select 1 from public.companies c where c.slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix;
  end loop;

  insert into public.companies (name, slug, created_by)
  values (v_name, v_slug, v_uid)
  returning * into v_company;

  insert into public.memberships (company_id, user_id, role_id)
  values (v_company.id, v_uid, v_owner_role);

  insert into public.teams (company_id, name)
  values (v_company.id, 'Equipe principal')
  returning id into v_team_id;

  insert into public.team_members (company_id, team_id, user_id)
  values (v_company.id, v_team_id, v_uid);

  insert into public.company_settings (company_id)
  values (v_company.id);

  return v_company;
end;
$$;

comment on function public.provision_company(text) is
  'Provisiona a imobiliária do usuário autenticado (company, owner, equipe padrão, configurações, trial).';

revoke execute on function public.provision_company(text) from public;
grant  execute on function public.provision_company(text) to authenticated;

-- Imobiliárias criadas antes desta migração: garante configurações e equipe padrão.
insert into public.company_settings (company_id)
select c.id from public.companies c
on conflict (company_id) do nothing;

insert into public.teams (company_id, name)
select c.id, 'Equipe principal'
from public.companies c
where not exists (select 1 from public.teams t where t.company_id = c.id)
on conflict (company_id, name) do nothing;

-- A RPC antiga é substituída por provision_company.
drop function if exists public.create_company_with_owner(text, text);

-- =============================================================================
-- Fim da migração 0004.
-- =============================================================================
