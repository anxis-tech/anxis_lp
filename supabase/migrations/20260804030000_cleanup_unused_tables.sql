-- Migration SQL V4: Remover Tabelas Desnecessárias e Depreciadas do Supabase
-- Limpeza de parametrizações visuais da Home que agora são editadas diretamente no código.

-- 1. REMOVER FAQ ITEMS (Perguntas Frequentes editadas diretamente no código da landing page)
DROP POLICY IF EXISTS "Public read faq_items" ON public.faq_items;
DROP POLICY IF EXISTS "Admin full access faq_items" ON public.faq_items;
DROP TABLE IF EXISTS public.faq_items CASCADE;

-- 2. REMOVER PAGE SECTIONS (Títulos e descrições de seções editados diretamente nos componentes Next.js)
DROP POLICY IF EXISTS "Public read page_sections" ON public.page_sections;
DROP POLICY IF EXISTS "Admin full access page_sections" ON public.page_sections;
DROP TABLE IF EXISTS public.page_sections CASCADE;

-- 3. REMOVER SERVICES (Lista de serviços mantida no código em components/sections/services-section.tsx)
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Admin full access services" ON public.services;
DROP TABLE IF EXISTS public.services CASCADE;

-- 4. REMOVER TECHNOLOGIES (Marquee de tecnologias mantido no código em lib/constants/technologies.ts)
DROP POLICY IF EXISTS "Public read technologies" ON public.technologies;
DROP POLICY IF EXISTS "Admin full access technologies" ON public.technologies;
DROP TABLE IF EXISTS public.technologies CASCADE;

-- 5. REMOVER TESTIMONIALS (Depoimentos mantidos no código em components/sections/testimonials-section.tsx)
DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;
DROP TABLE IF EXISTS public.testimonials CASCADE;

-- 6. REMOVER SITE SETTINGS (Configurações gerais mantidas em código/variáveis de ambiente)
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- 7. REMOVER ADMIN PROFILES ANTIGO (Substituído pela tabela V2 public.profiles integrada ao RBAC)
DROP POLICY IF EXISTS "Admin full access admin_profiles" ON public.admin_profiles;
DROP TABLE IF EXISTS public.admin_profiles CASCADE;

-- ========================================================
-- RESUMO DAS TABELAS MANTIDAS NO BANCO OPERACIONAL DA ANXIS:
-- 1.  public.projects                   (Cases do Portfólio da Home pública)
-- 2.  public.client_projects            (Projetos de Clientes e Contratos)
-- 3.  public.client_project_participants(Participantes secundários do projeto)
-- 4.  public.client_project_tasks       (Pendências/Sub-tarefas do projeto)
-- 5.  public.client_project_activity    (Histórico e timeline de movimentações)
-- 6.  public.kanban_stages              (4 Estágios do pipeline do Kanban)
-- 7.  public.roles                      (Cargos: Admin, Comercial, Designer)
-- 8.  public.permissions                (Permissões granulares)
-- 9.  public.role_permissions           (Permissões padrão por cargo)
-- 10. public.profiles                   (Perfis de usuários vinculados ao RBAC)
-- 11. public.user_permissions           (Sobrescritas de permissões por usuário)
-- 12. public.pricing_settings           (Taxas base da Calculadora)
-- 13. public.pricing_settings_history   (Histórico de alterações de taxas)
-- 14. public.quotes                     (Orçamentos comerciais salvos)
-- 15. public.audit_logs                 (Logs de auditoria de ações sensíveis)
-- 16. public.notifications              (Notificações internas do painel)
-- 17. public.leads                      (Captação de formulários de contato/leads)
-- ========================================================
