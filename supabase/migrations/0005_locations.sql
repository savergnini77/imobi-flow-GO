-- =============================================================================
-- Imobi Flow GO — Migração 0005: filiais (locations)
-- =============================================================================
-- Cria:
--   - public.locations         — filiais/escritórios da imobiliária
--   - public.location_members  — pessoas lotadas em cada filial
--   - teams.location_id        — equipe pertence (opcionalmente) a uma filial
--   - gatilhos de proteção (matriz e filial com vínculos)
--   - public.set_headquarters  — troca a matriz de forma atômica
--   - RLS + privilégios no mesmo padrão da 0001
--   - provision_company passa a criar a filial "Matriz"
--
-- Convenções (iguais à 0001):
--   - Toda tabela tem company_id; FKs compostas garantem a mesma imobiliária.
--   - Autorização sempre no banco: app.is_member / app.has_permission.
--
-- Códigos de erro próprios (lidos pelo app para mensagens em PT-BR):
--   LC001 — a matriz não pode ser desativada nem excluída
--   LC002 — filial com corretores ou equipes não pode ser excluída
--   LC003 — filial inativa não pode virar matriz
-- =============================================================================

-- -----------------------------------------------------------------------------
-- locations — filiais da imobiliária
-- -----------------------------------------------------------------------------
create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  name            text not null,
  code            text,
  phone           text,
  whatsapp        text,
  email           extensions.citext,
  cep             text,
  street          text,
  number          text,
  complement      text,
  neighborhood    text,
  city            text,
  state           text,
  latitude        numeric(9, 6),
  longitude       numeric(9, 6),
  is_headquarters boolean not null default false,
  is_active       boolean not null default true,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint locations_name_len_ck     check (char_length(btrim(name)) between 2 and 80),
  constraint locations_code_format_ck  check (code is null or code ~ '^[A-Z0-9-]{1,12}$'),
  constraint locations_phone_format_ck check (phone is null or phone ~ '^\d{10,11}$'),
  constraint locations_whats_format_ck check (whatsapp is null or whatsapp ~ '^\d{10,11}$'),
  constraint locations_email_format_ck check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint locations_cep_format_ck   check (cep is null or cep ~ '^\d{8}$'),
  constraint locations_state_format_ck check (state is null or state ~ '^[A-Z]{2}$'),
  constraint locations_lat_ck          check (latitude is null or latitude between -90 and 90),
  constraint locations_lng_ck          check (longitude is null or longitude between -180 and 180),
  constraint locations_hq_active_ck    check (not is_headquarters or is_active),
  constraint locations_company_name_uq unique (company_id, name),
  constraint locations_id_company_uq   unique (id, company_id)
);

create index locations_company_id_idx on public.locations (company_id);

-- no máximo UMA matriz por imobiliária
create unique index locations_one_hq_per_company_uq
  on public.locations (company_id)
  where is_headquarters;

-- código interno único por imobiliária (quando informado)
create unique index locations_company_code_uq
  on public.locations (company_id, code)
  where code is not null;

comment on table public.locations is 'Filiais/escritórios de uma imobiliária. Exatamente uma é a matriz.';

-- -----------------------------------------------------------------------------
-- location_members — pessoas lotadas em uma filial (sempre da mesma company)
-- -----------------------------------------------------------------------------
create table public.location_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null,
  location_id uuid not null,
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  constraint location_members_location_company_fk
    foreign key (location_id, company_id) references public.locations (id, company_id) on delete cascade,
  constraint location_members_membership_fk
    foreign key (company_id, user_id) references public.memberships (company_id, user_id) on delete cascade,
  constraint location_members_location_user_uq unique (location_id, user_id)
);

create index location_members_location_id_idx on public.location_members (location_id);
create index location_members_user_id_idx     on public.location_members (user_id);
create index location_members_company_id_idx  on public.location_members (company_id);

comment on table public.location_members is 'Chaves compostas garantem que filial e pessoa são da mesma imobiliária.';

-- -----------------------------------------------------------------------------
-- teams.location_id — equipe pertence (opcionalmente) a uma filial
-- -----------------------------------------------------------------------------
alter table public.teams add column location_id uuid;

alter table public.teams
  add constraint teams_location_company_fk
  foreign key (location_id, company_id) references public.locations (id, company_id)
  on delete set null (location_id);

create index teams_location_id_idx on public.teams (location_id);

-- =============================================================================
-- FUNÇÕES DE GATILHO
-- =============================================================================

-- Matriz não pode ser desativada; filial inativa não pode virar matriz.
-- is_headquarters só muda dentro de public.set_headquarters, que liga a flag
-- de transação app.hq_switch (não há como ligá-la pela API do PostgREST).
create or replace function public.locations_guard_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_headquarters is distinct from old.is_headquarters
     and coalesce(current_setting('app.hq_switch', true), '') <> 'on' then
    raise exception 'use set_headquarters para trocar a matriz'
      using errcode = 'LC001';
  end if;

  if old.is_headquarters and new.is_headquarters and not new.is_active then
    raise exception 'a matriz não pode ser desativada'
      using errcode = 'LC001';
  end if;

  if new.is_headquarters and not old.is_headquarters and not new.is_active then
    raise exception 'filial inativa não pode ser a matriz'
      using errcode = 'LC003';
  end if;

  return new;
end;
$$;

-- Matriz e filiais com vínculos não podem ser excluídas.
-- Exceção: exclusão em cascata da própria imobiliária (a company já não existe).
create or replace function public.locations_guard_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.companies c where c.id = old.company_id) then
    return old;
  end if;

  if old.is_headquarters then
    raise exception 'a matriz não pode ser excluída'
      using errcode = 'LC001';
  end if;

  if exists (select 1 from public.location_members lm where lm.location_id = old.id)
     or exists (select 1 from public.teams t where t.location_id = old.id) then
    raise exception 'filial possui corretores ou equipes vinculados'
      using errcode = 'LC002';
  end if;

  return old;
end;
$$;

create trigger set_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

create trigger locations_guard_update_tg
  before update of is_headquarters, is_active on public.locations
  for each row execute function public.locations_guard_update();

create trigger locations_guard_delete_tg
  before delete on public.locations
  for each row execute function public.locations_guard_delete();

-- =============================================================================
-- RPC: definir a matriz (troca atômica)
-- =============================================================================
create or replace function public.set_headquarters(p_location_id uuid)
returns public.locations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location public.locations;
begin
  select * into v_location
  from public.locations l
  where l.id = p_location_id;

  -- Mesmo erro para "não existe" e "sem acesso": não revela filiais de terceiros.
  if v_location.id is null
     or not app.has_permission(v_location.company_id, 'locations.update') then
    raise exception 'filial não encontrada ou sem permissão'
      using errcode = '42501';
  end if;

  if not v_location.is_active then
    raise exception 'filial inativa não pode ser a matriz'
      using errcode = 'LC003';
  end if;

  if v_location.is_headquarters then
    return v_location;
  end if;

  perform set_config('app.hq_switch', 'on', true);

  update public.locations
     set is_headquarters = false
   where company_id = v_location.company_id
     and is_headquarters;

  update public.locations
     set is_headquarters = true
   where id = v_location.id
  returning * into v_location;

  perform set_config('app.hq_switch', 'off', true);

  return v_location;
end;
$$;

comment on function public.set_headquarters(uuid) is
  'Define a filial como matriz da imobiliária (troca atômica). Exige locations.update.';

revoke execute on function public.set_headquarters(uuid) from public;
grant  execute on function public.set_headquarters(uuid) to authenticated;

-- =============================================================================
-- provision_company — agora também cria a filial "Matriz"
-- =============================================================================
-- Mesmo fluxo da 0004 (company → owner → equipe padrão → configurações → trial),
-- acrescentando a matriz com o owner lotado e a equipe padrão vinculada a ela.
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
  v_location   uuid;
  v_team_id    uuid;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'o nome da imobiliária deve ter entre 2 e 120 caracteres'
      using errcode = '22023';
  end if;

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

  -- Toda imobiliária nasce com a sua matriz, e o owner lotado nela.
  insert into public.locations (company_id, name, is_headquarters, created_by)
  values (v_company.id, 'Matriz', true, v_uid)
  returning id into v_location;

  insert into public.location_members (company_id, location_id, user_id)
  values (v_company.id, v_location, v_uid);

  insert into public.teams (company_id, name, location_id)
  values (v_company.id, 'Equipe principal', v_location)
  returning id into v_team_id;

  insert into public.team_members (company_id, team_id, user_id)
  values (v_company.id, v_team_id, v_uid);

  insert into public.company_settings (company_id)
  values (v_company.id);

  return v_company;
end;
$$;

revoke execute on function public.provision_company(text) from public;
grant  execute on function public.provision_company(text) to authenticated;

-- Imobiliárias criadas antes desta migração: garante uma matriz para cada uma.
insert into public.locations (company_id, name, is_headquarters, created_by)
select c.id, 'Matriz', true, c.created_by
from public.companies c
where not exists (select 1 from public.locations l where l.company_id = c.id);

-- ... e lota o criador (se ainda for membro) na matriz.
insert into public.location_members (company_id, location_id, user_id)
select l.company_id, l.id, c.created_by
from public.locations l
join public.companies c on c.id = l.company_id
join public.memberships m on m.company_id = c.id and m.user_id = c.created_by
where l.is_headquarters
on conflict (location_id, user_id) do nothing;

-- ... e vincula a equipe padrão sem filial à matriz.
update public.teams t
   set location_id = l.id
  from public.locations l
 where l.company_id = t.company_id
   and l.is_headquarters
   and t.location_id is null
   and t.name = 'Equipe principal';

-- =============================================================================
-- RLS e privilégios
-- =============================================================================
alter table public.locations        enable row level security;
alter table public.location_members enable row level security;

revoke all on public.locations        from anon;
revoke all on public.location_members from anon;

revoke all on public.locations from authenticated;
grant  select, insert, update, delete on public.locations to authenticated;
revoke all on public.location_members from authenticated;
grant  select, insert, delete on public.location_members to authenticated;

-- ---------- locations ----------
create policy locations_select on public.locations
  for select to authenticated
  using (app.is_member(company_id));

-- Nova filial nunca nasce como matriz: a troca é sempre via set_headquarters.
create policy locations_insert on public.locations
  for insert to authenticated
  with check (
    app.has_permission(company_id, 'locations.create')
    and not is_headquarters
    and created_by = (select auth.uid())
  );

create policy locations_update on public.locations
  for update to authenticated
  using (app.has_permission(company_id, 'locations.update'))
  with check (app.has_permission(company_id, 'locations.update'));

create policy locations_delete on public.locations
  for delete to authenticated
  using (app.has_permission(company_id, 'locations.delete'));

-- ---------- location_members ----------
create policy location_members_select on public.location_members
  for select to authenticated
  using (app.is_member(company_id));

create policy location_members_insert on public.location_members
  for insert to authenticated
  with check (app.has_permission(company_id, 'locations.manage_members'));

create policy location_members_delete on public.location_members
  for delete to authenticated
  using (app.has_permission(company_id, 'locations.manage_members'));

-- ---------- auditoria (mesmo gatilho da 0004) ----------
create trigger audit after insert or update or delete on public.locations
  for each row execute function app.audit();
create trigger audit after insert or update or delete on public.location_members
  for each row execute function app.audit();

-- =============================================================================
-- Fim da migração 0005.
-- =============================================================================
