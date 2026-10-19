-- =============================================================================
-- Imobi Flow GO — Migração 0007: índices para chaves estrangeiras
-- =============================================================================
-- Achado do Performance Advisor do Supabase: FKs sem índice de cobertura.
-- Sem índice, cada DELETE/UPDATE no lado referenciado (ex.: remover um membro,
-- que cascateia para equipes e filiais) faz varredura completa da tabela filha.
-- =============================================================================

create index if not exists companies_created_by_idx        on public.companies (created_by);
create index if not exists invitations_invited_by_idx      on public.invitations (invited_by);
create index if not exists invitations_role_id_idx         on public.invitations (role_id);
create index if not exists locations_created_by_idx        on public.locations (created_by);

-- FKs compostas (company_id + outra coluna), na ordem das colunas da FK.
create index if not exists team_members_company_user_idx       on public.team_members (company_id, user_id);
create index if not exists team_members_team_company_idx       on public.team_members (team_id, company_id);
create index if not exists location_members_company_user_idx   on public.location_members (company_id, user_id);
create index if not exists location_members_location_company_idx on public.location_members (location_id, company_id);
create index if not exists teams_location_company_idx          on public.teams (location_id, company_id);

-- =============================================================================
-- Fim da migração 0007.
-- =============================================================================
