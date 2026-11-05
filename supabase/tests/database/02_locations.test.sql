-- =============================================================================
-- Testes das filiais (pgTAP) — migração 0005_locations
-- Rodar com: supabase test db
-- Cobre: invariantes da matriz (LC001/LC003), exclusão com vínculos (LC002),
-- troca atômica de matriz, RLS de escrita e isolamento entre imobiliárias.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(22);

-- -----------------------------------------------------------------------------
-- Auxiliares (mesmo padrão de 01_tenant_security.test.sql)
-- -----------------------------------------------------------------------------
create function pg_temp.new_user(p_email text) returns uuid
language plpgsql as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, raw_user_meta_data)
  values (v_id, p_email, jsonb_build_object('full_name', split_part(p_email, '@', 1)));
  return v_id;
end;
$$;

create function pg_temp.act_as(p_uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
end;
$$;

-- UPDATE bloqueado pela RLS não dá erro: afeta 0 linhas. Devolve quantas mudaram.
create function pg_temp.rename_location(p_id uuid, p_name text) returns int
language plpgsql as $$
declare v_count int;
begin
  update public.locations set name = p_name where id = p_id;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on all functions in schema pg_temp to authenticated;

create temporary table ids (k text primary key, v uuid);
grant all on ids to authenticated;

insert into ids values
  ('alice', pg_temp.new_user('alice.loc@teste.dev')),
  ('bruno', pg_temp.new_user('bruno.loc@teste.dev'));

-- -----------------------------------------------------------------------------
-- Alice: imobiliária com matriz
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'alice'));
insert into ids select 'co_a', (public.provision_company('Imobiliária Filiais')).id;
insert into ids select 'hq_a', id from public.locations where is_headquarters;

select is((select count(*)::int from public.locations), 1, 'provisionamento cria só a matriz');
select is((select name from public.teams where location_id = (select v from ids where k = 'hq_a')),
  'Equipe principal', 'equipe padrão vinculada à matriz');

-- Nova filial
with ins as (
  insert into public.locations (company_id, name, created_by)
  values ((select v from ids where k = 'co_a'), 'Moema', (select v from ids where k = 'alice'))
  returning id
)
insert into ids select 'moema', id from ins;

select is((select count(*)::int from public.locations), 2, 'owner cria filial');

select throws_ok(
  $$ insert into public.locations (company_id, name, created_by)
     values ((select v from ids where k = 'co_a'), 'Moema', (select v from ids where k = 'alice')) $$,
  '23505', null, 'nome de filial é único por imobiliária');

select throws_ok(
  $$ insert into public.locations (company_id, name, is_headquarters, created_by)
     values ((select v from ids where k = 'co_a'), 'Outra matriz', true, (select v from ids where k = 'alice')) $$,
  '42501', null, 'filial nova não pode nascer como matriz');

-- -----------------------------------------------------------------------------
-- Invariantes da matriz
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ update public.locations set is_headquarters = true where id = (select v from ids where k = 'moema') $$,
  'LC001', null, 'matriz só muda via set_headquarters');

select throws_ok(
  $$ update public.locations set is_active = false where id = (select v from ids where k = 'hq_a') $$,
  'LC001', null, 'matriz não pode ser desativada');

select throws_ok(
  $$ delete from public.locations where id = (select v from ids where k = 'hq_a') $$,
  'LC001', null, 'matriz não pode ser excluída');

-- -----------------------------------------------------------------------------
-- Exclusão com vínculos
-- -----------------------------------------------------------------------------
insert into public.location_members (company_id, location_id, user_id)
values ((select v from ids where k = 'co_a'), (select v from ids where k = 'moema'),
        (select v from ids where k = 'alice'));

select throws_ok(
  $$ delete from public.locations where id = (select v from ids where k = 'moema') $$,
  'LC002', null, 'filial com pessoas lotadas não pode ser excluída');

delete from public.location_members where location_id = (select v from ids where k = 'moema');

-- -----------------------------------------------------------------------------
-- Troca de matriz
-- -----------------------------------------------------------------------------
update public.locations set is_active = false where id = (select v from ids where k = 'moema');

select throws_ok(
  $$ select public.set_headquarters((select v from ids where k = 'moema')) $$,
  'LC003', null, 'filial inativa não vira matriz');

update public.locations set is_active = true where id = (select v from ids where k = 'moema');

select lives_ok(
  $$ select public.set_headquarters((select v from ids where k = 'moema')) $$,
  'set_headquarters troca a matriz');

select is((select count(*)::int from public.locations where is_headquarters), 1,
  'continua existindo exatamente uma matriz');
select ok((select is_headquarters from public.locations where id = (select v from ids where k = 'moema')),
  'Moema agora é a matriz');
select ok(not (select is_headquarters from public.locations where id = (select v from ids where k = 'hq_a')),
  'a antiga matriz virou filial comum');

-- -----------------------------------------------------------------------------
-- Bruno (outra imobiliária): isolamento
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'bruno'));
insert into ids select 'co_b', (public.provision_company('Imobiliária Bruno')).id;

select is((select count(*)::int from public.locations), 1, 'bruno vê só a própria matriz');
select is((select count(*)::int from public.location_members), 1, 'bruno vê só os próprios vínculos');

select is(pg_temp.rename_location((select v from ids where k = 'moema'), 'Invadida'), 0,
  'bruno não altera filial de outra imobiliária');

select throws_ok(
  $$ select public.set_headquarters((select v from ids where k = 'hq_a')) $$,
  '42501', null, 'bruno não troca a matriz de outra imobiliária');

select throws_ok(
  $$ insert into public.locations (company_id, name, created_by)
     values ((select v from ids where k = 'co_a'), 'Intrusa', (select v from ids where k = 'bruno')) $$,
  '42501', null, 'bruno não cria filial em outra imobiliária');

select throws_ok(
  $$ insert into public.location_members (company_id, location_id, user_id)
     values ((select v from ids where k = 'co_b'), (select v from ids where k = 'hq_a'),
             (select v from ids where k = 'bruno')) $$,
  '23503', null, 'não lota pessoa em filial de outra imobiliária (FK composta)');

-- -----------------------------------------------------------------------------
-- Alice exclui filial vazia (a antiga matriz, agora comum e sem vínculos)
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'alice'));
update public.teams set location_id = null where location_id = (select v from ids where k = 'hq_a');
delete from public.location_members where location_id = (select v from ids where k = 'hq_a');

select lives_ok(
  $$ delete from public.locations where id = (select v from ids where k = 'hq_a') $$,
  'filial comum sem vínculos pode ser excluída');
select is((select count(*)::int from public.locations), 1, 'resta apenas a nova matriz');

select * from finish();
rollback;
