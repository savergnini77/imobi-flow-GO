-- =============================================================================
-- Imobi Flow GO — Fase 0 — Migração 0002: provisionamento de autenticação
-- =============================================================================
-- Cria a função public.create_company_with_owner:
--   cria a PRIMEIRA imobiliária do usuário autenticado e o vincula como 'owner'
--   na mesma transação.
--
-- Segurança:
--  - SECURITY DEFINER + search_path vazio + nomes de schema sempre explícitos.
--  - O usuário é derivado de auth.uid() (o token da requisição). NENHUM
--    parâmetro é usado para autorização — p_name e p_slug são apenas dados.
--  - EXECUTE revogado de PUBLIC; concedido apenas a authenticated.
--  - Nesta etapa da Fase 0: somente a primeira imobiliária por usuário
--    (erro se já existir qualquer membership do usuário).
--
-- Idempotente: pode rodar novamente (create or replace + revoke/grant).
-- =============================================================================

create or replace function public.create_company_with_owner(
  p_name text,
  p_slug text
)
returns public.companies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid        uuid := (select auth.uid());
  v_owner_role uuid;
  v_company    public.companies;
begin
  -- 1. Exige usuário autenticado. Derivado do token, nunca de parâmetro.
  if v_uid is null then
    raise exception 'usuário não autenticado'
      using errcode = '28000';
  end if;

  -- 2. Nesta etapa, apenas a primeira imobiliária por usuário.
  if exists (
    select 1 from public.memberships m where m.user_id = v_uid
  ) then
    raise exception 'usuário já pertence a uma imobiliária'
      using errcode = 'P0001';
  end if;

  -- 3. Normaliza e valida as entradas (dados de negócio, não autorização).
  p_name := btrim(coalesce(p_name, ''));
  p_slug := lower(btrim(coalesce(p_slug, '')));

  if char_length(p_name) < 2 or char_length(p_name) > 120 then
    raise exception 'nome da imobiliária inválido'
      using errcode = '22023';
  end if;

  if p_slug !~ '^[a-z0-9-]+$' then
    raise exception 'identificador (slug) da imobiliária inválido'
      using errcode = '22023';
  end if;

  -- 4. Slug precisa estar livre. A constraint UNIQUE em companies.slug continua
  --    sendo a garantia final em caso de concorrência.
  if exists (
    select 1 from public.companies c where c.slug = p_slug
  ) then
    raise exception 'identificador (slug) já está em uso'
      using errcode = '23505';
  end if;

  -- 5. Papel de sistema 'owner'.
  select r.id
    into v_owner_role
  from public.roles r
  where r.company_id is null
    and r.slug = 'owner';

  if v_owner_role is null then
    raise exception 'papel de sistema "owner" não encontrado — rode o seed'
      using errcode = 'P0001';
  end if;

  -- 6. Cria a imobiliária.
  insert into public.companies (name, slug, created_by)
  values (p_name, p_slug, v_uid)
  returning * into v_company;

  -- 7. Vincula o usuário como owner.
  insert into public.memberships (company_id, user_id, role_id)
  values (v_company.id, v_uid, v_owner_role);

  return v_company;
end;
$$;

comment on function public.create_company_with_owner(text, text) is
  'Cria a primeira imobiliária do usuário autenticado (auth.uid()) e o vincula como owner. SECURITY DEFINER, search_path vazio.';

-- -----------------------------------------------------------------------------
-- Permissões de execução
-- -----------------------------------------------------------------------------
revoke execute on function public.create_company_with_owner(text, text) from public;
grant  execute on function public.create_company_with_owner(text, text) to authenticated;

-- =============================================================================
-- Fim da migração 0002.
-- =============================================================================
