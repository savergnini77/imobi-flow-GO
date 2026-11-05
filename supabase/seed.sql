-- =============================================================================
-- Imobi Flow GO — Seed (dados de referência)
-- =============================================================================
-- Carrega dados de referência (não é dado de teste):
--   1. permissions      — catálogo fixo de permissões
--   2. roles            — papéis de sistema (company_id IS NULL)
--   3. role_permissions — matriz papel <-> permissão
--   4. feature_flags    — catálogo de funcionalidades liberáveis
--
-- Idempotente: pode rodar várias vezes. A matriz dos papéis de sistema é
-- recalculada a cada execução (remove o que saiu, insere o que entrou).
-- Não cria imobiliária, usuário nem convite.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Permissões
-- -----------------------------------------------------------------------------
insert into public.permissions (key, description) values
  ('company.view',          'Ver os dados da imobiliária'),
  ('company.manage',        'Editar os dados da imobiliária'),
  ('company.delete',        'Excluir a imobiliária'),
  ('settings.manage',       'Editar as configurações da imobiliária'),
  ('billing.manage',        'Gerenciar plano e pagamentos'),
  ('audit.view',            'Ver o histórico de auditoria'),
  ('members.view',          'Ver os membros da imobiliária'),
  ('members.invite',        'Convidar novos membros'),
  ('members.update_role',   'Alterar o papel de um membro'),
  ('members.remove',        'Remover um membro'),
  ('teams.view',            'Ver as equipes'),
  ('teams.create',          'Criar equipes'),
  ('teams.update',          'Editar equipes'),
  ('teams.delete',          'Excluir equipes'),
  ('teams.manage_members',  'Gerenciar os integrantes de uma equipe'),
  ('locations.view',        'Ver as filiais'),
  ('locations.create',      'Criar filiais'),
  ('locations.update',      'Editar filiais e definir a matriz'),
  ('locations.delete',      'Excluir filiais'),
  ('locations.manage_members', 'Gerenciar quem está lotado em cada filial'),
  ('roles.view',            'Ver os papéis e permissões'),
  ('roles.manage',          'Criar e editar papéis personalizados'),
  ('invitations.view',      'Ver os convites'),
  ('invitations.create',    'Criar convites'),
  ('invitations.revoke',    'Revogar convites')
on conflict (key) do update set description = excluded.description;

-- -----------------------------------------------------------------------------
-- 2. Papéis de sistema
-- -----------------------------------------------------------------------------
insert into public.roles (company_id, slug, name, is_system) values
  (null, 'owner',     'Proprietário',   true),
  (null, 'admin',     'Administrador',  true),
  (null, 'manager',   'Gerente',        true),
  (null, 'agent',     'Corretor',       true),
  (null, 'assistant', 'Assistente',     true)
on conflict (slug) where company_id is null do update set name = excluded.name;

-- -----------------------------------------------------------------------------
-- 3. Matriz papel <-> permissão (papéis de sistema)
-- -----------------------------------------------------------------------------
-- Escrita como lista desejada; o seed sincroniza a tabela com ela.
drop table if exists pg_temp.seed_role_matrix;
create temporary table seed_role_matrix (role_slug text, permission_key text);

-- owner: todas
insert into seed_role_matrix
select 'owner', p.key from public.permissions p;

-- admin: todas, menos excluir a imobiliária e cobrança
insert into seed_role_matrix
select 'admin', p.key from public.permissions p
where p.key not in ('company.delete', 'billing.manage');

-- manager (gerente): opera equipes e convida, sem administrar papéis
insert into seed_role_matrix (role_slug, permission_key) values
  ('manager', 'company.view'),
  ('manager', 'members.view'),
  ('manager', 'members.invite'),
  ('manager', 'teams.view'),
  ('manager', 'teams.create'),
  ('manager', 'teams.update'),
  ('manager', 'teams.manage_members'),
  ('manager', 'locations.view'),
  ('manager', 'locations.manage_members'),
  ('manager', 'roles.view'),
  ('manager', 'invitations.view'),
  ('manager', 'invitations.create'),
  ('manager', 'invitations.revoke');

-- agent (corretor): leitura operacional
insert into seed_role_matrix (role_slug, permission_key) values
  ('agent', 'company.view'),
  ('agent', 'members.view'),
  ('agent', 'teams.view'),
  ('agent', 'locations.view'),
  ('agent', 'roles.view');

-- assistant (assistente): leitura básica
insert into seed_role_matrix (role_slug, permission_key) values
  ('assistant', 'company.view'),
  ('assistant', 'members.view'),
  ('assistant', 'teams.view'),
  ('assistant', 'locations.view');

-- remove o que não está mais na matriz
delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.company_id is null
  and not exists (
    select 1 from seed_role_matrix m
    where m.role_slug = r.slug and m.permission_key = p.key
  );

-- insere o que falta
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from seed_role_matrix m
join public.roles r on r.company_id is null and r.slug = m.role_slug
join public.permissions p on p.key = m.permission_key
on conflict (role_id, permission_id) do nothing;

drop table seed_role_matrix;

-- -----------------------------------------------------------------------------
-- 4. Feature flags
-- -----------------------------------------------------------------------------
insert into public.feature_flags (key, description, default_enabled) values
  ('crm.contacts',       'Contatos e timeline',                    false),
  ('crm.opportunities',  'Oportunidades e funil kanban',           false),
  ('properties',         'Cadastro de imóveis',                    false),
  ('agenda',             'Agenda, tarefas e visitas',              false),
  ('ai.copilot',         'Copiloto de IA',                         false)
on conflict (key) do update set description = excluded.description;

-- =============================================================================
-- Fim do seed.
-- =============================================================================
