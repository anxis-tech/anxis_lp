-- ==============================================================================
-- MIGRATION: Finance Module Permissions Registration
-- Register new finance permission keys in public.permissions table
-- ==============================================================================

INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('finance', 'view', 'finance.view', 'Visualizar Módulo Financeiro no painel'),
  ('finance', 'view_values', 'finance.view_values', 'Visualizar Valores em R$ e Faturamento'),
  ('finance', 'view_payments', 'finance.view_payments', 'Visualizar Tabela de Pagamentos e Histórico')
ON CONFLICT (permission_key) DO NOTHING;
