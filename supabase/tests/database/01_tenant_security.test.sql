-- =============================================================================
-- Testes de segurança multiempresa (pgTAP)
-- Rodar com: supabase test db
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(41);

-- -----------------------------------------------------------------------------
-- Auxiliares: criar usuário de teste e agir como ele
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

create function pg_temp.act_as_postgres() returns void
language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end;
$$;

grant execute on all functions in schema pg_temp to authenticated;

create temporary table ids (k text primary key, v uuid);
grant all on ids to authenticated;

insert into ids values
  ('alice', pg_temp.new_user('alice@teste.dev')),
  ('bruno', pg_temp.new_user('bruno@teste.dev')),
  ('carla', pg_temp.new_user('carla@teste.dev')),
  ('davi',  pg_temp.new_user('davi@teste.dev'));

-- -----------------------------------------------------------------------------
-- Provisionamento
-- -----------------------------------------------------------------------------
select ok(exists(select 1 from public.profiles where id = (select v from ids where k = 'alice')),
  'perfil criado pelo gatilho de auth');

select pg_temp.act_as((select v from ids where k = 'alice'));
insert into ids select 'co_a', (public.provision_company('Imobiliária São João')).id;

select is((select slug from public.companies where id = (select v from ids where k = 'co_a')),
  'imobiliaria-sao-joao', 'slug gerado sem acentos');
select is((select count(*)::int from public.memberships), 1, 'owner vinculado');
select ok(app.is_owner((select v from ids where k = 'co_a')), 'alice é owner');
select is((select name from public.teams), 'Equipe principal', 'equipe padrão criada');
select is((select name from public.locations where is_headquarters), 'Matriz', 'matriz criada');
select is((select count(*)::int from public.location_members), 1, 'owner lotado na matriz');
select is((select count(*)::int from public.team_members), 1, 'owner está na equipe padrão');
select is((select timezone from public.company_settings), 'America/Sao_Paulo', 'configurações criadas');
select is((select subscription_status from public.companies), 'trialing', 'trial iniciado');
select ok((select trial_ends_at > now() + interval '13 days' from public.companies), 'trial de 14 dias');

select throws_ok($$ select public.provision_company('Segunda') $$, 'P0001', null,
  'usuário não cria segunda imobiliária');
select throws_ok($$ select public.provision_company('x') $$, '22023', null,
  'nome curto é rejeitado');

-- Escrita direta bloqueada
select throws_ok(
  $$ insert into public.companies (name, slug, created_by)
     values ('Órfã', 'orfa', (select v from ids where k = 'alice')) $$,
  '42501', null, 'INSERT direto em companies bloqueado');
select throws_ok(
  $$ insert into public.memberships (company_id, user_id, role_id)
     values ((select v from ids where k = 'co_a'), (select v from ids where k = 'bruno'),
             (select id from public.roles where slug = 'owner' and company_id is null)) $$,
  '42501', null, 'INSERT direto em memberships bloqueado');
select throws_ok(
  $$ update public.companies set plan = 'business' $$,
  '42501', null, 'plano não pode ser alterado pelo cliente');

-- -----------------------------------------------------------------------------
-- Isolamento entre imobiliárias
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'bruno'));
insert into ids select 'co_b', (public.provision_company('Imobiliária São João')).id;

select is((select slug from public.companies where id = (select v from ids where k = 'co_b')),
  'imobiliaria-sao-joao-2', 'slug repetido recebe sufixo');
select is((select count(*)::int from public.companies), 1, 'bruno vê só a própria imobiliária');
select is((select count(*)::int from public.company_settings), 1, 'bruno vê só as próprias configurações');
select is((select count(*)::int from public.teams), 1, 'bruno vê só as próprias equipes');
select is((select count(*)::int from public.memberships), 1, 'bruno vê só as próprias memberships');
select is((select count(*)::int from public.profiles), 1, 'bruno não vê perfis de outra imobiliária');
select throws_ok(
  $$ select public.create_invitation((select v from ids where k = 'co_a'), 'x@teste.dev',
       (select id from public.roles where slug = 'agent' and company_id is null)) $$,
  '42501', null, 'bruno não convida para a imobiliária de alice');

-- -----------------------------------------------------------------------------
-- Convites
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'alice'));
create temporary table tokens (k text primary key, token text);
grant all on tokens to authenticated;

insert into tokens
select 'carla', token from public.create_invitation(
  (select v from ids where k = 'co_a'), 'Carla@Teste.dev',
  (select id from public.roles where slug = 'admin' and company_id is null));
insert into tokens
select 'davi', token from public.create_invitation(
  (select v from ids where k = 'co_a'), 'davi@teste.dev',
  (select id from public.roles where slug = 'agent' and company_id is null));

select ok((select token_hash <> (select token from tokens where k = 'carla')
           from public.invitations where email = 'carla@teste.dev'),
  'o token puro não é armazenado');

-- carla tenta aceitar o convite do davi
select pg_temp.act_as((select v from ids where k = 'carla'));
select throws_ok($$ select public.accept_invitation((select token from tokens where k = 'davi')) $$,
  '42501', null, 'convite de outro e-mail é recusado');
select throws_ok($$ select public.accept_invitation('token-falso') $$,
  'P0002', null, 'token inválido é recusado');
select is(public.accept_invitation((select token from tokens where k = 'carla')),
  (select v from ids where k = 'co_a'), 'carla aceita o próprio convite');
select is((select count(*)::int from public.companies), 1, 'carla passa a ver a imobiliária');

-- -----------------------------------------------------------------------------
-- Escalada de papel (carla é admin)
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ select public.change_member_role(
       (select id from public.memberships where user_id = (select v from ids where k = 'carla')),
       (select id from public.roles where slug = 'owner' and company_id is null)) $$,
  'P0001', null, 'admin não altera o próprio papel');
select throws_ok(
  $$ select public.change_member_role(
       (select id from public.memberships where user_id = (select v from ids where k = 'alice')),
       (select id from public.roles where slug = 'agent' and company_id is null)) $$,
  '42501', null, 'admin não rebaixa o owner');
select throws_ok(
  $$ select public.remove_member(
       (select id from public.memberships where user_id = (select v from ids where k = 'alice'))) $$,
  '42501', null, 'admin não remove o owner');
select throws_ok(
  $$ select public.create_invitation((select v from ids where k = 'co_a'), 'novo@teste.dev',
       (select id from public.roles where slug = 'owner' and company_id is null)) $$,
  '42501', null, 'admin não convida como owner');

-- Papéis personalizados: só concede o que possui
insert into public.roles (company_id, slug, name)
values ((select v from ids where k = 'co_a'), 'captador', 'Captador');
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.slug = 'captador' and p.key = 'members.view';
select is((select count(*)::int from public.role_permissions rp
           join public.roles r on r.id = rp.role_id where r.slug = 'captador'),
  1, 'admin concede permissão que possui a papel personalizado');
select throws_ok(
  $$ insert into public.role_permissions (role_id, permission_id)
     select r.id, p.id from public.roles r, public.permissions p
     where r.slug = 'captador' and p.key = 'company.delete' $$,
  '42501', null, 'admin não concede permissão que não possui');
select throws_ok(
  $$ insert into public.role_permissions (role_id, permission_id)
     select r.id, p.id from public.roles r, public.permissions p
     where r.slug = 'agent' and r.company_id is null and p.key = 'company.delete' $$,
  '42501', null, 'papéis de sistema não podem ser alterados');

-- -----------------------------------------------------------------------------
-- Último owner e auditoria
-- -----------------------------------------------------------------------------
select pg_temp.act_as((select v from ids where k = 'alice'));
select throws_ok(
  $$ select public.remove_member(
       (select id from public.memberships where user_id = (select v from ids where k = 'alice'))) $$,
  'P0001', null, 'o último owner não pode sair');
select ok((select count(*) > 0 from public.audit_log
           where company_id = (select v from ids where k = 'co_a')),
  'owner lê a auditoria da própria imobiliária');
select is((select count(*)::int from public.audit_log
           where company_id = (select v from ids where k = 'co_b')),
  0, 'owner não lê a auditoria de outra imobiliária');

-- -----------------------------------------------------------------------------
-- Anônimo
-- -----------------------------------------------------------------------------
select pg_temp.act_as_postgres();
set local role anon;
select throws_ok($$ select count(*) from public.companies $$, '42501', null,
  'anon não acessa companies');
select throws_ok($$ select public.provision_company('Invasora') $$, '42501', null,
  'anon não executa RPCs');
select throws_ok($$ select public.protect_last_owner() $$, '42501', null,
  'funções de gatilho não são expostas');

select * from finish();
rollback;
