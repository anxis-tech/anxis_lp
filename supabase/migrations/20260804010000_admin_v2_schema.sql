-- Migration SQL V2: System RBAC, Client Projects, Pricing Calculator & Audit Logs

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE, -- 'admin', 'comercial', 'designer'
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Roles
INSERT INTO public.roles (name, slug, description, is_system_role)
VALUES 
  ('Administrador', 'admin', 'Acesso total e irrestrito a todos os módulos e configurações', TRUE),
  ('Comercial', 'comercial', 'Acesso aos Projetos de Clientes e Calculadora de Precificação', TRUE),
  ('Designer', 'designer', 'Acesso aos Projetos de Clientes e mídias do Portfólio', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module TEXT NOT NULL, -- 'portfolio', 'client_projects', 'pricing', 'users', 'audit'
  action TEXT NOT NULL, -- 'view', 'create', 'edit', 'delete', 'reorder', etc.
  permission_key TEXT UNIQUE NOT NULL, -- 'portfolio.view', 'client_projects.create', etc.
  description TEXT NOT NULL
);

-- Seed Initial Permissions
INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('portfolio', 'view', 'portfolio.view', 'Visualizar projetos do Portfólio da Home'),
  ('portfolio', 'create', 'portfolio.create', 'Criar novos projetos no Portfólio da Home'),
  ('portfolio', 'edit', 'portfolio.edit', 'Editar projetos do Portfólio da Home'),
  ('portfolio', 'delete', 'portfolio.delete', 'Excluir projetos do Portfólio da Home'),
  ('portfolio', 'reorder', 'portfolio.reorder', 'Reordenar projetos do Portfólio da Home'),
  ('portfolio', 'publish', 'portfolio.publish', 'Publicar ou ocultar projetos no Portfólio'),

  ('client_projects', 'view', 'client_projects.view', 'Visualizar Projetos de Clientes internos'),
  ('client_projects', 'create', 'client_projects.create', 'Criar novos Projetos de Clientes'),
  ('client_projects', 'edit', 'client_projects.edit', 'Editar detalhes dos Projetos de Clientes'),
  ('client_projects', 'delete', 'client_projects.delete', 'Excluir Projetos de Clientes'),
  ('client_projects', 'upload_files', 'client_projects.upload_files', 'Fazer upload de arquivos nos projetos'),
  ('client_projects', 'delete_files', 'client_projects.delete_files', 'Remover arquivos dos projetos'),
  ('client_projects', 'change_status', 'client_projects.change_status', 'Alterar status do pipeline do projeto'),
  ('client_projects', 'assign_users', 'client_projects.assign_users', 'Atribuir responsável ao projeto'),

  ('pricing', 'view', 'pricing.view', 'Visualizar a Calculadora de Precificação'),
  ('pricing', 'use', 'pricing.use', 'Utilizar a Calculadora de Precificação'),
  ('pricing', 'save_quote', 'pricing.save_quote', 'Salvar orçamentos gerados'),
  ('pricing', 'view_history', 'pricing.view_history', 'Visualizar histórico de orçamentos salvos'),
  ('pricing', 'manage_settings', 'pricing.manage_settings', 'Configurar taxas e valores da calculadora'),

  ('users', 'view', 'users.view', 'Visualizar a lista de usuários da equipe'),
  ('users', 'create', 'users.create', 'Criar novos usuários na plataforma'),
  ('users', 'edit', 'users.edit', 'Editar dados de usuários'),
  ('users', 'activate', 'users.activate', 'Ativar ou desativar usuários'),
  ('users', 'reset_password', 'users.reset_password', 'Redefinir senha de usuários'),
  ('users', 'manage_roles', 'users.manage_roles', 'Alterar cargo de usuários'),
  ('users', 'manage_permissions', 'users.manage_permissions', 'Gerenciar permissões granulares de usuários'),
  ('users', 'delete', 'users.delete', 'Excluir contas de usuários'),

  ('audit', 'view', 'audit.view', 'Visualizar logs de auditoria do sistema')
ON CONFLICT (permission_key) DO NOTHING;

-- 3. ROLE PERMISSIONS MAPPING
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_allowed BOOLEAN DEFAULT TRUE,
  UNIQUE(role_id, permission_id)
);

-- Seed Role Permissions Mapping
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

  -- Admin gets ALL permissions
  FOR v_perm IN SELECT id FROM public.permissions LOOP
    INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
    VALUES (v_admin_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Comercial gets Client Projects & Pricing
  FOR v_perm IN SELECT id FROM public.permissions WHERE module IN ('client_projects', 'pricing') LOOP
    INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
    VALUES (v_comercial_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
  END LOOP;

  -- Designer gets Client Projects & Portfolio View/Edit
  FOR v_perm IN SELECT id FROM public.permissions WHERE module IN ('client_projects', 'portfolio') LOOP
    INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
    VALUES (v_designer_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 4. USER PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 5. USER PERMISSIONS OVERRIDES
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  source TEXT DEFAULT 'custom', -- 'custom' or 'inherited'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, permission_id)
);

-- 6. CLIENT PROJECTS TABLE (Internal Client Contracts)
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  project_type TEXT NOT NULL, -- 'Landing Page', 'Site Institucional', 'Loja Virtual', 'Reformulação', etc.
  platform TEXT, -- 'Tray', 'Nuvemshop', 'WordPress', 'WooCommerce', 'Next.js', etc.
  status TEXT DEFAULT 'Novo', -- 'Novo', 'Em design', 'Em desenvolvimento', 'Em revisão', 'Aprovado', 'Concluído'
  priority TEXT DEFAULT 'Média', -- 'Baixa', 'Média', 'Alta', 'Urgente'
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE,
  deadline DATE,
  estimated_completion_date DATE,
  description TEXT,
  briefing_json JSONB DEFAULT '{}'::jsonb,
  content_json JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CLIENT PROJECT FILES TABLE (Private Files)
CREATE TABLE IF NOT EXISTS public.client_project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT DEFAULT 'Geral', -- 'Identidade visual', 'Imagens', 'Copy', 'Documentos', 'Contratos', 'Outros'
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. CLIENT PROJECT LINKS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'Referência', -- 'Protótipo', 'Repositório', 'Hospedagem', 'Referência'
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CLIENT PROJECT STATUS HISTORY
CREATE TABLE IF NOT EXISTS public.client_project_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PRICING SETTINGS TABLE (Pricing Calculator Base Configs)
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_json JSONB NOT NULL DEFAULT '{
    "baseRates": {
      "Landing Page": 2500,
      "Site Institucional": 4500,
      "Loja Virtual": 6500,
      "Reformulação": 3500,
      "Desenvolvimento Personalizado": 8500,
      "Integração": 2000
    },
    "perPageRate": 350,
    "perCustomPageRate": 600,
    "perProductRate": 5,
    "perFormRate": 200,
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

-- 11. PRICING SETTINGS HISTORY
CREATE TABLE IF NOT EXISTS public.pricing_settings_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settings_id UUID REFERENCES public.pricing_settings(id),
  previous_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. QUOTES TABLE (Saved Estimates)
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  status TEXT DEFAULT 'Rascunho', -- 'Rascunho', 'Enviado', 'Aprovado', 'Recusado'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL, -- 'create_user', 'update_user_permission', 'delete_project', etc.
  module TEXT NOT NULL, -- 'users', 'portfolio', 'client_projects', 'pricing'
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS POLICIES ENABLEMENT
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper RLS functions
CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role_slug TEXT;
  v_has_custom BOOLEAN;
  v_has_role BOOLEAN;
BEGIN
  -- Check if user is admin (full access)
  SELECT r.slug INTO v_role_slug
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id
  WHERE p.user_id = p_user_id AND p.is_active = TRUE;

  IF v_role_slug = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Check custom user permission override first
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

-- RLS READ/WRITE Policies for Authenticated Admin/Team Members (Idempotent)
DROP POLICY IF EXISTS "Auth members read profiles" ON public.profiles;
CREATE POLICY "Auth members read profiles" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth members read roles" ON public.roles;
CREATE POLICY "Auth members read roles" ON public.roles FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth members read permissions" ON public.permissions;
CREATE POLICY "Auth members read permissions" ON public.permissions FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth members read client_projects" ON public.client_projects;
CREATE POLICY "Auth members read client_projects" ON public.client_projects FOR SELECT USING (public.check_user_permission(auth.uid(), 'client_projects.view'));

DROP POLICY IF EXISTS "Auth members write client_projects" ON public.client_projects;
CREATE POLICY "Auth members write client_projects" ON public.client_projects FOR ALL USING (public.check_user_permission(auth.uid(), 'client_projects.create') OR public.check_user_permission(auth.uid(), 'client_projects.edit'));

DROP POLICY IF EXISTS "Auth members read pricing_settings" ON public.pricing_settings;
CREATE POLICY "Auth members read pricing_settings" ON public.pricing_settings FOR SELECT USING (public.check_user_permission(auth.uid(), 'pricing.view'));

DROP POLICY IF EXISTS "Auth members read quotes" ON public.quotes;
CREATE POLICY "Auth members read quotes" ON public.quotes FOR SELECT USING (public.check_user_permission(auth.uid(), 'pricing.view'));

DROP POLICY IF EXISTS "Auth members write quotes" ON public.quotes;
CREATE POLICY "Auth members write quotes" ON public.quotes FOR ALL USING (public.check_user_permission(auth.uid(), 'pricing.save_quote'));
