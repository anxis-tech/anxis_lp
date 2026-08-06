-- ==============================================================================
-- MIGRATION: Contracts System Schema
-- Creates contracts table, contract_generation_jobs table, permissions, and RLS
-- Safe for production: uses IF NOT EXISTS, ON CONFLICT DO NOTHING
-- ==============================================================================

-- 1. CONTRACTS TABLE
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  quote_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  client_data_snapshot JSONB NOT NULL DEFAULT '{}',
  project_data_snapshot JSONB NOT NULL DEFAULT '{}',
  pricing_snapshot JSONB DEFAULT '{}',
  final_value NUMERIC(12,2) DEFAULT 0,
  storage_path TEXT,
  file_name TEXT,
  file_size BIGINT DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONTRACT GENERATION JOBS TABLE
CREATE TABLE IF NOT EXISTS public.contract_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contract_jobs_contract_id ON public.contract_generation_jobs(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_jobs_status ON public.contract_generation_jobs(status);

-- 4. TRIGGERS
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_jobs_updated_at ON public.contract_generation_jobs;
CREATE TRIGGER update_contract_jobs_updated_at
  BEFORE UPDATE ON public.contract_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Contracts RLS policies
DROP POLICY IF EXISTS "Auth read contracts" ON public.contracts;
CREATE POLICY "Auth read contracts" ON public.contracts FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    public.check_user_permission(auth.uid(), 'contracts.view')
    OR public.check_user_permission(auth.uid(), 'client_projects.view_all')
    OR public.check_user_permission(auth.uid(), 'client_projects.view')
    OR EXISTS (SELECT 1 FROM public.client_projects WHERE id = project_id AND responsible_user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Auth write contracts" ON public.contracts;
CREATE POLICY "Auth write contracts" ON public.contracts FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    public.check_user_permission(auth.uid(), 'contracts.generate')
    OR public.check_user_permission(auth.uid(), 'client_projects.create')
    OR public.check_user_permission(auth.uid(), 'client_projects.edit')
  )
);

-- Jobs RLS policies
DROP POLICY IF EXISTS "Auth read contract_jobs" ON public.contract_generation_jobs;
CREATE POLICY "Auth read contract_jobs" ON public.contract_generation_jobs FOR SELECT USING (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Auth write contract_jobs" ON public.contract_generation_jobs;
CREATE POLICY "Auth write contract_jobs" ON public.contract_generation_jobs FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- 6. NEW PERMISSIONS
INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('contracts', 'view', 'contracts.view', 'Visualizar contratos gerados'),
  ('contracts', 'generate', 'contracts.generate', 'Gerar contratos para projetos'),
  ('contracts', 'download', 'contracts.download', 'Baixar contratos em PDF')
ON CONFLICT (permission_key) DO NOTHING;
