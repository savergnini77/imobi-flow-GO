-- =============================================================================
-- Imobi Flow GO — Migração 0006: privilégios de execução das funções
-- =============================================================================
-- Achado do Security Advisor do Supabase:
--  - O Supabase concede EXECUTE em funções do schema public DIRETAMENTE aos
--    papéis anon e authenticated (privilégio padrão). Um "revoke ... from
--    public" não remove essas concessões. Resultado: visitantes sem login
--    conseguiam chamar as RPCs (que recusavam pela checagem de auth.uid(), mas
--    era uma única camada) e as funções de GATILHO ficavam expostas como RPC.
--  - set_updated_at sem search_path fixo.
--
-- Regra a partir daqui:
--  - anon não executa nenhuma função do schema public.
--  - Funções de gatilho não são executáveis por ninguém da API.
--  - RPCs de negócio: só authenticated.
-- =============================================================================

-- Funções futuras não nascem executáveis pelo anon.
alter default privileges in schema public revoke execute on functions from anon;

-- Nenhuma função atual do schema public é executável pelo anon.
revoke execute on all functions in schema public from anon;

-- Funções de gatilho: fora da API para todos.
revoke execute on function public.set_updated_at()              from public, anon, authenticated;
revoke execute on function public.handle_new_user()             from public, anon, authenticated;
revoke execute on function public.enforce_role_company_match()  from public, anon, authenticated;
revoke execute on function public.protect_last_owner()          from public, anon, authenticated;
revoke execute on function public.locations_guard_update()      from public, anon, authenticated;
revoke execute on function public.locations_guard_delete()      from public, anon, authenticated;

-- search_path fixo também na função de timestamp.
alter function public.set_updated_at() set search_path = '';

-- =============================================================================
-- Fim da migração 0006.
-- =============================================================================
