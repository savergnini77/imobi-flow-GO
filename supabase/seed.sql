-- =============================================================================
-- Imobi Flow GO — Fase 0 — Seed
-- =============================================================================
-- Carrega dados de referência (não é dado de teste):
--   1. permissions   — catálogo fixo de permissões da Fase 0
--   2. roles         — papéis de sistema (company_id IS NULL)
--   3. role_permissions — matriz papel <-> permissão
--
-- Idempotente: pode rodar várias vezes (ON CONFLICT DO NOTHING).
-- Não cria imobiliária, usuário nem convite.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Permissões
-- -----------------------------------------------------------------------------
insert into public.permissions (key, description) values
  ('company.view',          'Ver os dados da imobiliária'),
  ('company.manage',        'Editar os dados da imobiliária'),
  ('company.delete',        'Excluir a imobiliária'),
  ('members.view',          'Ver os membros da imobiliária'),
  ('members.invite',        'Convidar novos membros'),
  ('members.update_role',   'Alterar o papel de um membro'),
  ('members.remove',        'Remover um membro'),
  ('teams.view',            'Ver as equipes'),
  ('teams.create',          'Criar equipes'),
  ('teams.update',          'Editar equipes'),
  ('teams.delete',          'Excluir equipes'),
  ('teams.manage_members',  'Gerenciar os integrantes de uma equipe'),
  ('roles.view',            'Ver os papéis e permissões'),
  ('roles.manage',          'Criar e editar papéis personalizados'),
  ('invitations.view',      'Ver os convites'),
  ('invitations.create',    'Criar convites'),
  ('invitations.revoke',    'Revogar convites')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Papéis de sistema
-- -----------------------------------------------------------------------------
insert into public.roles (company_id, slug, name, is_system) values
  (null, 'owner',     'Proprietário',   true),
  (null, 'admin',     'Administrador',  true),
  (null, 'agent',     'Corretor',       true),
  (null, 'assistant', 'Assistente',     true)
on conflict (slug) where company_id is null do nothing;

-- -----------------------------------------------------------------------------
-- 3. Matriz papel <-> permissão
-- -----------------------------------------------------------------------------

-- owner: todas as permissões
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.company_id is null
  and r.slug = 'owner'
on conflict (role_id, permission_id) do nothing;

-- admin: todas, menos company.delete
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key <> 'company.delete'
where r.company_id is null
  and r.slug = 'admin'
on conflict (role_id, permission_id) do nothing;

-- agent (corretor): leitura operacional
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.key in (
    'company.view',
    'members.view',
    'teams.view',
    'roles.view',
    'invitations.view'
  )
where r.company_id is null
  and r.slug = 'agent'
on conflict (role_id, permission_id) do nothing;

-- assistant (assistente): leitura básica
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p
  on p.key in (
    'company.view',
    'members.view',
    'teams.view'
  )
where r.company_id is null
  and r.slug = 'assistant'
on conflict (role_id, permission_id) do nothing;

-- =============================================================================
-- Fim do seed.
-- =============================================================================
