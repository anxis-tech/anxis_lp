-- ==============================================================================
-- MIGRATION: Complete Full Supabase Production Setup
-- Non-destructive, idempotent migration for Production environment
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- 'admin', 'comercial', 'designer'
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles (name, slug, description, is_system_role)
VALUES 
  ('Administrador', 'admin', 'Acesso total e irrestrito a todos os módulos e configurações', TRUE),
  ('Comercial', 'comercial', 'Acesso aos Projetos de Clientes e Calculadora de Precificação', TRUE),
  ('Designer', 'designer', 'Acesso aos Projetos de Clientes e mídias do Portfólio', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 4. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  permission_key TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('dashboard', 'view', 'dashboard.view', 'Visualizar o Dashboard com métricas'),
  ('portfolio', 'view', 'portfolio.view', 'Visualizar projetos do Portfólio da Home'),
  ('portfolio', 'create', 'portfolio.create', 'Criar novos projetos no Portfólio da Home'),
  ('portfolio', 'edit', 'portfolio.edit', 'Editar projetos do Portfólio da Home'),
  ('portfolio', 'delete', 'portfolio.delete', 'Excluir projetos do Portfólio da Home'),
  ('portfolio', 'reorder', 'portfolio.reorder', 'Reordenar projetos do Portfólio da Home'),
  ('portfolio', 'publish', 'portfolio.publish', 'Publicar ou ocultar projetos no Portfólio'),

  ('client_projects', 'view', 'client_projects.view', 'Visualizar Projetos de Clientes'),
  ('client_projects', 'view_all', 'client_projects.view_all', 'Visualizar TODOS os projetos da empresa'),
  ('client_projects', 'view_assigned', 'client_projects.view_assigned', 'Visualizar SOMENTE projetos atribuídos a você'),
  ('client_projects', 'create', 'client_projects.create', 'Criar novos Projetos de Clientes'),
  ('client_projects', 'edit', 'client_projects.edit', 'Editar detalhes dos Projetos de Clientes'),
  ('client_projects', 'delete', 'client_projects.delete', 'Excluir Projetos de Clientes'),
  ('client_projects', 'upload_files', 'client_projects.upload_files', 'Fazer upload de arquivos nos projetos'),
  ('client_projects', 'delete_files', 'client_projects.delete_files', 'Remover arquivos dos projetos'),
  ('client_projects', 'change_status', 'client_projects.change_status', 'Alterar status do pipeline do projeto'),
  ('client_projects', 'assign_responsible', 'client_projects.assign_responsible', 'Atribuir ou alterar responsável do projeto'),
  ('client_projects', 'manage_participants', 'client_projects.manage_participants', 'Gerenciar participantes do projeto'),
  ('client_projects', 'move_kanban', 'client_projects.move_kanban', 'Mover cards no Kanban'),

  ('pricing', 'view', 'pricing.view', 'Visualizar a Calculadora de Precificação'),
  ('pricing', 'use', 'pricing.use', 'Utilizar a Calculadora de Precificação'),
  ('pricing', 'save_quote', 'pricing.save_quote', 'Salvar orçamentos gerados'),
  ('pricing', 'view_history', 'quotes_history.view', 'Visualizar histórico de orçamentos'),
  ('pricing', 'manage_settings', 'pricing.manage_settings', 'Configurar taxas e valores da calculadora'),

  ('users', 'view', 'users.view', 'Visualizar a lista de usuários da equipe'),
  ('users', 'create', 'users.create', 'Criar novos usuários'),
  ('users', 'edit', 'users.edit', 'Editar dados de usuários'),
  ('users', 'activate', 'users.activate', 'Ativar ou desativar usuários'),
  ('users', 'reset_password', 'users.reset_password', 'Redefinir senha de usuários'),
  ('users', 'manage_roles', 'users.manage_roles', 'Alterar cargo de usuários'),
  ('users', 'manage_permissions', 'users.manage_permissions', 'Gerenciar permissões de abas por usuário'),

  ('audit', 'view', 'audit.view', 'Visualizar logs de auditoria do sistema')
ON CONFLICT (permission_key) DO NOTHING;

-- 5. ROLE PERMISSIONS MAPPING
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_allowed BOOLEAN DEFAULT TRUE,
  UNIQUE(role_id, permission_id)
);

-- Seed Role Permissions
DO $$
DECLARE
  v_admin_id UUID;
  v_comercial_id UUID;
  v_designer_id UUID;
  v_perm RECORD;
BEGIN
  SELECT id INTO v_admin_id FROM public.roles WHERE slug = 'admin';
  SELECT id INTO v_comercial_id FROM public.roles WHERE slug = 'comercial';
  SELECT id INTO v_designer_id FROM public.roles WHERE slug = 'designer';

  IF v_admin_id IS NOT NULL THEN
    FOR v_perm IN SELECT id FROM public.permissions LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_admin_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  IF v_comercial_id IS NOT NULL THEN
    FOR v_perm IN SELECT id FROM public.permissions WHERE module IN ('client_projects', 'pricing', 'dashboard') LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_comercial_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  IF v_designer_id IS NOT NULL THEN
    FOR v_perm IN SELECT id FROM public.permissions WHERE module IN ('client_projects', 'portfolio', 'dashboard') LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_designer_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 6. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_access_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_access_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Trigger for Auto-Creating Profile on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE slug = 'admin' LIMIT 1;

  INSERT INTO public.profiles (user_id, full_name, email, role_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    v_role_id,
    TRUE
  )
  ON CONFLICT (user_id) DO UPDATE
  SET last_access_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. USER PERMISSIONS OVERRIDES
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- 8. PUBLIC HOME PORTFOLIO TABLE (projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  client TEXT NOT NULL,
  year TEXT NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  live_url TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS live_url TEXT;

-- 9. KANBAN PIPELINE STAGES TABLE
CREATE TABLE IF NOT EXISTS public.kanban_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#0075FF',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_initial BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kanban_stages ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT FALSE;
ALTER TABLE public.kanban_stages ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

INSERT INTO public.kanban_stages (name, slug, color, display_order, is_initial, is_completed) VALUES
  ('Novo projeto', 'novo-projeto', '#0075FF', 1, TRUE, FALSE),
  ('Em desenvolvimento', 'em-desenvolvimento', '#3B82F6', 2, FALSE, FALSE),
  ('Aguardando revisão', 'aguardando-revisao', '#F59E0B', 3, FALSE, FALSE),
  ('Concluído', 'concluido', '#10B981', 4, FALSE, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, color = EXCLUDED.color, display_order = EXCLUDED.display_order;

-- 10. SAVED QUOTES TABLE (quotes)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  company TEXT,
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  platform TEXT,
  form_data JSONB NOT NULL,
  pricing_snapshot JSONB NOT NULL,
  calculation_breakdown JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  additional_costs NUMERIC(10,2) DEFAULT 0,
  taxes NUMERIC(10,2) DEFAULT 0,
  final_value NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'Rascunho',
  notes TEXT,
  created_by_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add missing columns to quotes table if it already existed
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS linked_project_id UUID;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS created_by_name TEXT;

-- 11. CLIENT PROJECTS TABLE (client_projects)
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  project_type TEXT NOT NULL,
  platform TEXT DEFAULT 'Next.js',
  status TEXT DEFAULT 'Novo projeto',
  kanban_stage_id UUID REFERENCES public.kanban_stages(id) ON DELETE SET NULL,
  kanban_position INT DEFAULT 0,
  priority TEXT DEFAULT 'Normal',
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsible_user_name TEXT,
  responsible_user_email TEXT,

  -- Financial & Quote Linkage
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  quote_data JSONB DEFAULT '{}'::jsonb,
  approved_value NUMERIC(10,2) DEFAULT 0,
  paid_value NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'Pendente',
  payment_link TEXT,
  payment_method TEXT,
  paid_at TIMESTAMPTZ,

  -- Scope & Briefing
  start_date DATE,
  deadline TEXT,
  estimated_completion_date DATE,
  description TEXT,
  internal_notes TEXT,
  client_contact_json JSONB DEFAULT '{}'::jsonb,
  scope_briefing_json JSONB DEFAULT '{}'::jsonb,
  content_copy_json JSONB DEFAULT '{}'::jsonb,
  
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add missing columns to client_projects table if it already existed
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS quote_id UUID;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS quote_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS approved_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS paid_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'Pendente';
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS responsible_user_name TEXT;
ALTER TABLE public.client_projects ADD COLUMN IF NOT EXISTS responsible_user_email TEXT;

-- Add Foreign Key for linked_project_id in quotes safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_quotes_linked_project'
  ) THEN
    ALTER TABLE public.quotes ADD CONSTRAINT fk_quotes_linked_project 
      FOREIGN KEY (linked_project_id) REFERENCES public.client_projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 12. CLIENT PROJECT FILES TABLE
CREATE TABLE IF NOT EXISTS public.client_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT DEFAULT 'Geral',
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. CLIENT PROJECT LINKS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'Referência',
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CLIENT PROJECT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 15. CLIENT PROJECT TASKS / PENDÊNCIAS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsible_user_name TEXT,
  status TEXT DEFAULT 'Pendente',
  priority TEXT DEFAULT 'Normal',
  deadline DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CLIENT PROJECT ACTIVITY TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.client_project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT 'project',
  entity_id TEXT,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. PRICING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_json JSONB NOT NULL DEFAULT '{
    "baseRates": {
      "Landing page": 2500,
      "Página de vendas": 3200,
      "Site institucional": 4500,
      "Loja virtual": 6500,
      "Blog": 3800,
      "Integração ou funcionalidade": 2500
    },
    "perPageRate": 350,
    "perAdditionalPageRate": 500,
    "customCodeRate": 3500,
    "blogModuleRate": 1200,
    "complexityMultipliers": {
      "Simples": 1.0,
      "Intermediária": 1.25,
      "Avançada": 1.5,
      "Personalizada": 2.0
    },
    "urgencyMultipliers": {
      "Sem urgência": 1.0,
      "Prazo normal": 1.0,
      "Urgente": 1.3,
      "Prioridade máxima": 1.6
    },
    "contentRates": {
      "Cliente fornecerá todo o conteúdo": 0,
      "Revisão de conteúdo": 400,
      "Adaptação de conteúdo": 800,
      "Criação completa de copy": 1800
    },
    "defaultMarginPercent": 20,
    "taxPercent": 8,
    "maxDiscountPercent": 15
  }'::jsonb,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('portfolio-public', 'portfolio-public', TRUE),
  ('client-project-files', 'client-project-files', FALSE),
  ('avatars', 'avatars', TRUE),
  ('quote-documents', 'quote-documents', FALSE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 21. ROW LEVEL SECURITY (RLS) ENABLEMENT ON ALL TABLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Authorization Check Function
CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_slug TEXT;
  v_has_custom BOOLEAN;
  v_has_role BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user is active admin
  SELECT r.slug INTO v_role_slug
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.user_id = p_user_id AND p.is_active = TRUE;

  IF v_role_slug = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check individual custom permission override first
  SELECT is_allowed INTO v_has_custom
  FROM public.user_permissions up
  JOIN public.permissions perm ON up.permission_id = perm.id
  WHERE up.user_id = p_user_id AND perm.permission_key = p_permission_key;

  IF v_has_custom IS NOT NULL THEN
    RETURN v_has_custom;
  END IF;

  -- Fallback to role permissions
  SELECT rp.is_allowed INTO v_has_role
  FROM public.profiles p
  JOIN public.role_permissions rp ON p.role_id = rp.role_id
  JOIN public.permissions perm ON rp.permission_id = perm.id
  WHERE p.user_id = p_user_id AND p.is_active = TRUE AND perm.permission_key = p_permission_key;

  RETURN COALESCE(v_has_role, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS POLICIES FOR TABLES
DROP POLICY IF EXISTS "Public read portfolio projects" ON public.projects;
CREATE POLICY "Public read portfolio projects" ON public.projects FOR SELECT USING (is_published = TRUE OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth write portfolio projects" ON public.projects;
CREATE POLICY "Auth write portfolio projects" ON public.projects FOR ALL USING (public.check_user_permission(auth.uid(), 'portfolio.edit'));

DROP POLICY IF EXISTS "Auth read profiles" ON public.profiles;
CREATE POLICY "Auth read profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read kanban_stages" ON public.kanban_stages;
CREATE POLICY "Auth read kanban_stages" ON public.kanban_stages FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read client_projects" ON public.client_projects;
CREATE POLICY "Auth read client_projects" ON public.client_projects FOR SELECT USING (
  public.check_user_permission(auth.uid(), 'client_projects.view_all')
  OR responsible_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.client_project_participants WHERE project_id = public.client_projects.id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth write client_projects" ON public.client_projects;
CREATE POLICY "Auth write client_projects" ON public.client_projects FOR ALL USING (
  public.check_user_permission(auth.uid(), 'client_projects.edit') OR responsible_user_id = auth.uid()
);

DROP POLICY IF EXISTS "Auth read client_project_subtables" ON public.client_project_files;
CREATE POLICY "Auth read client_project_subtables" ON public.client_project_files FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read client_project_links" ON public.client_project_links;
CREATE POLICY "Auth read client_project_links" ON public.client_project_links FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read client_project_participants" ON public.client_project_participants;
CREATE POLICY "Auth read client_project_participants" ON public.client_project_participants FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read client_project_tasks" ON public.client_project_tasks;
CREATE POLICY "Auth read client_project_tasks" ON public.client_project_tasks FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read client_project_activity" ON public.client_project_activity;
CREATE POLICY "Auth read client_project_activity" ON public.client_project_activity FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read notifications" ON public.notifications;
CREATE POLICY "Auth read notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Auth read quotes" ON public.quotes;
CREATE POLICY "Auth read quotes" ON public.quotes FOR SELECT USING (public.check_user_permission(auth.uid(), 'quotes_history.view') OR public.check_user_permission(auth.uid(), 'pricing.view'));

DROP POLICY IF EXISTS "Auth write quotes" ON public.quotes;
CREATE POLICY "Auth write quotes" ON public.quotes FOR ALL USING (public.check_user_permission(auth.uid(), 'pricing.save_quote'));

DROP POLICY IF EXISTS "Auth read pricing_settings" ON public.pricing_settings;
CREATE POLICY "Auth read pricing_settings" ON public.pricing_settings FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth read audit_logs" ON public.audit_logs;
CREATE POLICY "Auth read audit_logs" ON public.audit_logs FOR ALL USING (public.check_user_permission(auth.uid(), 'audit.view'));

-- STORAGE RLS POLICIES
DROP POLICY IF EXISTS "Public Read Portfolio Storage" ON storage.objects;
CREATE POLICY "Public Read Portfolio Storage" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-public');

DROP POLICY IF EXISTS "Auth Upload Portfolio Storage" ON storage.objects;
CREATE POLICY "Auth Upload Portfolio Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio-public' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Client Project Files Storage" ON storage.objects;
CREATE POLICY "Auth Client Project Files Storage" ON storage.objects FOR ALL USING (bucket_id = 'client-project-files' AND auth.uid() IS NOT NULL);
