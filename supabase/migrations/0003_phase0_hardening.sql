-- =============================================================================
-- Imobi Flow GO — Fase 0 — Migração 0003: endurecimento de segurança
-- =============================================================================
-- Corrige falhas encontradas na revisão do núcleo (0001/0002):
--
--  1. companies: INSERT direto pela API permitia criar empresas órfãs e
--     reservar slugs. Agora a criação acontece apenas via RPC.
--  2. memberships: INSERT/UPDATE/DELETE diretos permitiam escalada de papel
--     (admin virar owner, adicionar qualquer usuário). Agora só via RPCs:
--       - change_member_role
--       - remove_member
--     e via accept_invitation / provisionamento.
--  3. Último owner: gatilho impede que a imobiliária fique sem proprietário.
--  4. Convites: fluxo completo por RPC (create / accept / revoke / preview).
--     O token puro nunca é armazenado (apenas SHA-256).
--  5. role_permissions: papéis personalizados agora podem receber permissões,
--     sem que ninguém conceda uma permissão que não possui.
--  6. Privilégios padrão: tabelas futuras não nascem acessíveis ao anon.
--
-- Convenção de erros (SQLSTATE) usada pelas RPCs:
--   28000 não autenticado · 42501 sem permissão · P0002 não encontrado
--   22023 dado inválido   · P0001 regra de negócio
-- =============================================================================

-- =============================================================================
-- FUNÇÕES AUXILIARES
-- =============================================================================

-- O papel é o papel de sistema 'owner'?
create or replace function app.is_owner_role(p_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles r
    where r.id = p_role_id
      and r.company_id is null
      and r.slug = 'owner'
  );
$$;

-- Quantos owners a imobiliária tem.
create or replace function app.owner_count(p_company_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.memberships m
  join public.roles r on r.id = m.role_id
  where m.company_id = p_company_id
    and r.company_id is null
    and r.slug = 'owner';
$$;

-- Converte texto em uuid sem lançar erro (usado em políticas de Storage).
create or replace function app.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

-- SHA-256 em hex (mesmo formato de invitations.token_hash).
create or replace function app.sha256_hex(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(convert_to(p_value, 'UTF8'), 'sha256'), 'hex');
$$;

revoke all on function app.is_owner_role(uuid)   from public;
revoke all on function app.owner_count(uuid)     from public;
revoke all on function app.try_uuid(text)        from public;
revoke all on function app.sha256_hex(text)      from public;
grant execute on function app.is_owner_role(uuid) to authenticated, service_role;
grant execute on function app.owner_count(uuid)   to authenticated, service_role;
grant execute on function app.try_uuid(text)      to authenticated, service_role;
grant execute on function app.sha256_hex(text)    to authenticated, service_role;

-- =============================================================================
-- 1. COMPANIES — criação somente via RPC
-- =============================================================================
drop policy if exists companies_insert_authenticated on public.companies;
revoke insert on public.companies from authenticated;

-- =============================================================================
-- 2. MEMBERSHIPS — escrita somente via RPC
-- =============================================================================
drop policy if exists memberships_insert on public.memberships;
drop policy if exists memberships_update on public.memberships;
drop policy if exists memberships_delete on public.memberships;
revoke insert, update, delete on public.memberships from authenticated;

-- -----------------------------------------------------------------------------
-- 3. Gatilho: a imobiliária nunca fica sem owner
-- -----------------------------------------------------------------------------
-- Exceções: quando a própria imobiliária ou o perfil do usuário está sendo
-- excluído (ON DELETE CASCADE), a remoção é permitida.
create or replace function public.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not app.is_owner_role(old.role_id) then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    if app.is_owner_role(new.role_id) and new.company_id = old.company_id then
      return new;
    end if;
  end if;

  -- Exclusão em cascata da imobiliária ou do usuário.
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.companies c where c.id = old.company_id)
       or not exists (select 1 from public.profiles p where p.id = old.user_id) then
      return old;
    end if;
  end if;

  if app.owner_count(old.company_id) <= 1 then
    raise exception 'a imobiliária precisa ter ao menos um proprietário'
      using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists memberships_protect_last_owner on public.memberships;
create trigger memberships_protect_last_owner
  before update of role_id, company_id or delete on public.memberships
  for each row execute function public.protect_last_owner();

-- -----------------------------------------------------------------------------
-- change_member_role — altera o papel de um membro
-- -----------------------------------------------------------------------------
create or replace function public.change_member_role(
  p_membership_id uuid,
  p_role_id uuid
)
returns public.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_member public.memberships;
  v_role   public.roles;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  select * into v_member
  from public.memberships m
  where m.id = p_membership_id
  for update;

  if v_member.id is null or not app.is_member(v_member.company_id) then
    raise exception 'membro não encontrado' using errcode = 'P0002';
  end if;

  if not app.has_permission(v_member.company_id, 'members.update_role') then
    raise exception 'sem permissão para alterar papéis' using errcode = '42501';
  end if;

  if v_member.user_id = v_uid then
    raise exception 'você não pode alterar o seu próprio papel' using errcode = 'P0001';
  end if;

  select * into v_role
  from public.roles r
  where r.id = p_role_id
    and (r.company_id is null or r.company_id = v_member.company_id);

  if v_role.id is null then
    raise exception 'papel não encontrado' using errcode = 'P0002';
  end if;

  -- Somente um owner atribui ou retira o papel de owner.
  if (app.is_owner_role(v_member.role_id) or app.is_owner_role(p_role_id))
     and not app.is_owner(v_member.company_id) then
    raise exception 'apenas o proprietário pode alterar o papel de proprietário'
      using errcode = '42501';
  end if;

  update public.memberships
     set role_id = p_role_id
   where id = p_membership_id
  returning * into v_member;

  return v_member;
end;
$$;

-- -----------------------------------------------------------------------------
-- remove_member — remove um membro (ou sair da imobiliária, se for você)
-- -----------------------------------------------------------------------------
create or replace function public.remove_member(p_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := (select auth.uid());
  v_member public.memberships;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  select * into v_member
  from public.memberships m
  where m.id = p_membership_id
  for update;

  if v_member.id is null or not app.is_member(v_member.company_id) then
    raise exception 'membro não encontrado' using errcode = 'P0002';
  end if;

  -- Sair da imobiliária é sempre permitido (respeitando o último owner).
  if v_member.user_id <> v_uid then
    if not app.has_permission(v_member.company_id, 'members.remove') then
      raise exception 'sem permissão para remover membros' using errcode = '42501';
    end if;

    if app.is_owner_role(v_member.role_id) and not app.is_owner(v_member.company_id) then
      raise exception 'apenas o proprietário pode remover outro proprietário'
        using errcode = '42501';
    end if;
  end if;

  delete from public.memberships where id = p_membership_id;
end;
$$;

-- =============================================================================
-- 4. CONVITES — fluxo completo por RPC
-- =============================================================================
drop policy if exists invitations_insert on public.invitations;
drop policy if exists invitations_update on public.invitations;
drop policy if exists invitations_delete on public.invitations;
revoke insert, update, delete on public.invitations from authenticated;

-- -----------------------------------------------------------------------------
-- create_invitation — gera o convite e devolve o token puro UMA única vez
-- -----------------------------------------------------------------------------
-- Um convite pendente anterior para o mesmo e-mail é revogado (reenvio).
create or replace function public.create_invitation(
  p_company_id uuid,
  p_email text,
  p_role_id uuid
)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_role  public.roles;
  v_token text;
  v_inv   public.invitations;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  if not app.has_permission(p_company_id, 'invitations.create') then
    raise exception 'sem permissão para convidar' using errcode = '42501';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'e-mail inválido' using errcode = '22023';
  end if;

  select * into v_role
  from public.roles r
  where r.id = p_role_id
    and (r.company_id is null or r.company_id = p_company_id);

  if v_role.id is null then
    raise exception 'papel não encontrado' using errcode = 'P0002';
  end if;

  if app.is_owner_role(p_role_id) and not app.is_owner(p_company_id) then
    raise exception 'apenas o proprietário pode convidar outro proprietário'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.memberships m
    join auth.users u on u.id = m.user_id
    where m.company_id = p_company_id
      and lower(u.email) = v_email
  ) then
    raise exception 'esta pessoa já faz parte da imobiliária' using errcode = 'P0001';
  end if;

  update public.invitations i
     set status = 'revoked'
   where i.company_id = p_company_id
     and i.email = v_email
     and i.status = 'pending';

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.invitations (company_id, email, role_id, token_hash, invited_by)
  values (p_company_id, v_email, p_role_id, app.sha256_hex(v_token), v_uid)
  returning * into v_inv;

  invitation_id := v_inv.id;
  token         := v_token;
  expires_at    := v_inv.expires_at;
  return next;
end;
$$;

-- -----------------------------------------------------------------------------
-- get_invitation_preview — dados mínimos para a tela de aceite
-- -----------------------------------------------------------------------------
-- Quem tem o token pode ver o nome da imobiliária e o papel. Nada além disso.
create or replace function public.get_invitation_preview(p_token text)
returns table (
  company_name text,
  role_name text,
  email text,
  status public.invitation_status,
  is_expired boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.name,
    r.name,
    i.email::text,
    i.status,
    i.expires_at < now()
  from public.invitations i
  join public.companies c on c.id = i.company_id
  join public.roles r on r.id = i.role_id
  where i.token_hash = app.sha256_hex(coalesce(p_token, ''));
$$;

-- -----------------------------------------------------------------------------
-- accept_invitation — o usuário autenticado aceita o convite
-- -----------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text;
  v_inv   public.invitations;
begin
  if v_uid is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = v_uid;

  select * into v_inv
  from public.invitations i
  where i.token_hash = app.sha256_hex(coalesce(p_token, ''))
  for update;

  if v_inv.id is null then
    raise exception 'convite inválido' using errcode = 'P0002';
  end if;

  if v_inv.status = 'accepted' then
    if exists (
      select 1 from public.memberships m
      where m.company_id = v_inv.company_id and m.user_id = v_uid
    ) then
      return v_inv.company_id;
    end if;
    raise exception 'este convite já foi utilizado' using errcode = 'P0001';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'este convite não está mais disponível' using errcode = 'P0001';
  end if;

  if v_inv.expires_at < now() then
    raise exception 'este convite expirou' using errcode = 'P0001';
  end if;

  if v_email is distinct from lower(v_inv.email::text) then
    raise exception 'este convite foi enviado para outro e-mail' using errcode = '42501';
  end if;

  insert into public.memberships (company_id, user_id, role_id)
  values (v_inv.company_id, v_uid, v_inv.role_id)
  on conflict (company_id, user_id) do nothing;

  update public.invitations
     set status = 'accepted',
         accepted_at = now()
   where id = v_inv.id;

  return v_inv.company_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- revoke_invitation
-- -----------------------------------------------------------------------------
create or replace function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitations;
begin
  if (select auth.uid()) is null then
    raise exception 'usuário não autenticado' using errcode = '28000';
  end if;

  select * into v_inv
  from public.invitations i
  where i.id = p_invitation_id
  for update;

  if v_inv.id is null or not app.is_member(v_inv.company_id) then
    raise exception 'convite não encontrado' using errcode = 'P0002';
  end if;

  if not app.has_permission(v_inv.company_id, 'invitations.revoke') then
    raise exception 'sem permissão para revogar convites' using errcode = '42501';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'apenas convites pendentes podem ser revogados' using errcode = 'P0001';
  end if;

  update public.invitations set status = 'revoked' where id = p_invitation_id;
end;
$$;

-- =============================================================================
-- 5. ROLE_PERMISSIONS — papéis personalizados recebem permissões
-- =============================================================================
drop policy if exists role_permissions_no_insert on public.role_permissions;
drop policy if exists role_permissions_no_update on public.role_permissions;
drop policy if exists role_permissions_no_delete on public.role_permissions;

-- Só em papel da própria imobiliária (nunca de sistema), com roles.manage,
-- e apenas permissões que o próprio usuário possui.
create policy role_permissions_insert on public.role_permissions
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.roles r
      join public.permissions p on p.id = role_permissions.permission_id
      where r.id = role_permissions.role_id
        and r.company_id is not null
        and app.has_permission(r.company_id, 'roles.manage')
        and app.has_permission(r.company_id, p.key)
    )
  );

create policy role_permissions_delete on public.role_permissions
  for delete to authenticated
  using (
    exists (
      select 1
      from public.roles r
      where r.id = role_permissions.role_id
        and r.company_id is not null
        and app.has_permission(r.company_id, 'roles.manage')
    )
  );

grant insert, delete on public.role_permissions to authenticated;

-- =============================================================================
-- 6. PRIVILÉGIOS PADRÃO — objetos futuros não nascem expostos ao anon
-- =============================================================================
alter default privileges in schema public revoke all on tables    from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- =============================================================================
-- Permissões de execução das RPCs
-- =============================================================================
revoke execute on function public.protect_last_owner()                        from public;
revoke execute on function public.change_member_role(uuid, uuid)              from public;
revoke execute on function public.remove_member(uuid)                         from public;
revoke execute on function public.create_invitation(uuid, text, uuid)         from public;
revoke execute on function public.get_invitation_preview(text)                from public;
revoke execute on function public.accept_invitation(text)                     from public;
revoke execute on function public.revoke_invitation(uuid)                     from public;

grant execute on function public.change_member_role(uuid, uuid)      to authenticated;
grant execute on function public.remove_member(uuid)                 to authenticated;
grant execute on function public.create_invitation(uuid, text, uuid) to authenticated;
grant execute on function public.get_invitation_preview(text)        to authenticated;
grant execute on function public.accept_invitation(text)             to authenticated;
grant execute on function public.revoke_invitation(uuid)             to authenticated;

-- =============================================================================
-- Fim da migração 0003.
-- =============================================================================
