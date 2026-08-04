-- Migration SQL V3: Kanban Pipeline Stages (4 Estágios), Strict Responsible Assignment RLS, Tasks & Activity Timeline
-- 100% Idempotente e Compatível com o Supabase SQL Editor

-- Habilitar extensões necessárias para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. KANBAN STAGES TABLE
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
  project_limit INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed EXACT 4 Kanban Pipeline Stages Specified by User
INSERT INTO public.kanban_stages (name, slug, color, display_order, is_initial, is_completed) VALUES
  ('Novo projeto', 'novo-projeto', '#0075FF', 1, TRUE, FALSE),
  ('Em desenvolvimento', 'em-desenvolvimento', '#3B82F6', 2, FALSE, FALSE),
  ('Aguardando revisão', 'aguardando-revisao', '#F59E0B', 3, FALSE, FALSE),
  ('Concluído', 'concluido', '#10B981', 4, FALSE, TRUE)
ON CONFLICT (slug) DO UPDATE 
SET name = EXCLUDED.name, color = EXCLUDED.color, display_order = EXCLUDED.display_order;

-- Clean up any legacy unused stages
DELETE FROM public.kanban_stages WHERE slug NOT IN ('novo-projeto', 'em-desenvolvimento', 'aguardando-revisao', 'concluido');

-- 2. ALTER CLIENT PROJECTS WITH DETAILED SECTIONS & STAGE LINK
ALTER TABLE public.client_projects 
  ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kanban_stage_id UUID REFERENCES public.kanban_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS kanban_position INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_status TEXT DEFAULT 'Não solicitado',
  ADD COLUMN IF NOT EXISTS client_contact_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS scope_briefing_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_copy_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Legacy Status Migration mapping to 4 stages
UPDATE public.client_projects 
SET status = 'Novo projeto' 
WHERE status IN ('Novo', 'Aguardando briefing', 'Aguardando materiais', 'Planejamento', 'Em planejamento');

UPDATE public.client_projects 
SET status = 'Em desenvolvimento' 
WHERE status IN ('Em design', 'Em desenvolvimento', 'Ajustes', 'Ajustes solicitados');

UPDATE public.client_projects 
SET status = 'Aguardando revisão' 
WHERE status IN ('Em revisão interna', 'Aguardando aprovação', 'Aguardando cliente');

UPDATE public.client_projects 
SET status = 'Concluído' 
WHERE status IN ('Aprovado', 'Publicação', 'Publicado', 'Concluído', 'Pausado', 'Cancelado');

-- 3. CLIENT PROJECT PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. CLIENT PROJECT TASKS / PENDÊNCIAS TABLE
CREATE TABLE IF NOT EXISTS public.client_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Pendente',
  priority TEXT DEFAULT 'Normal',
  deadline DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLIENT PROJECT ACTIVITY TIMELINE TABLE
CREATE TABLE IF NOT EXISTS public.client_project_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT DEFAULT 'project',
  entity_id TEXT,
  previous_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INTERNAL NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 7. SEED NEW KANBAN & ASSIGNMENT PERMISSIONS
INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('client_projects', 'assign_responsible', 'client_projects.assign_responsible', 'Atribuir ou alterar responsável do projeto'),
  ('client_projects', 'view_all', 'client_projects.view_all', 'Visualizar TODOS os projetos da empresa (Gestor/Admin)'),
  ('client_projects', 'view_assigned', 'client_projects.view_assigned', 'Visualizar SOMENTE projetos atribuídos a você (Profissional)'),
  ('client_projects', 'manage_participants', 'client_projects.manage_participants', 'Adicionar ou remover participantes do projeto'),
  ('client_projects', 'move_kanban', 'client_projects.move_kanban', 'Mover cards entre as colunas do Kanban')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant permissions to Admin & roles safely
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
    FOR v_perm IN SELECT id FROM public.permissions WHERE permission_key IN (
      'client_projects.assign_responsible', 'client_projects.view_all', 
      'client_projects.view_assigned', 'client_projects.manage_participants', 'client_projects.move_kanban'
    ) LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_admin_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  IF v_comercial_id IS NOT NULL THEN
    FOR v_perm IN SELECT id FROM public.permissions WHERE permission_key IN ('client_projects.view_all', 'client_projects.assign_responsible', 'client_projects.move_kanban') LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_comercial_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  IF v_designer_id IS NOT NULL THEN
    FOR v_perm IN SELECT id FROM public.permissions WHERE permission_key IN ('client_projects.view_assigned', 'client_projects.move_kanban') LOOP
      INSERT INTO public.role_permissions (role_id, permission_id, is_allowed)
      VALUES (v_designer_id, v_perm.id, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_client_projects_responsible ON public.client_projects(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_kanban_stage ON public.client_projects(kanban_stage_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_deadline ON public.client_projects(deadline);

-- 9. ENABLE RLS FOR NEW TABLES & STRICT USER ACCESS POLICY
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active kanban stages" ON public.kanban_stages;
CREATE POLICY "Public read active kanban stages" ON public.kanban_stages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Strict user read client_projects" ON public.client_projects;
CREATE POLICY "Strict user read client_projects" ON public.client_projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON p.role_id = r.id
    WHERE p.user_id = auth.uid() AND r.slug = 'admin'
  )
  OR responsible_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.client_project_participants WHERE project_id = id AND user_id = auth.uid())
);
