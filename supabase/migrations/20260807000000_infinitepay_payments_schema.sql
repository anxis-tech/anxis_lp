-- ==============================================================================
-- MIGRATION: InfinitePay Payments & Webhook Schema
-- Safe for production: uses IF NOT EXISTS, ON CONFLICT DO NOTHING, RLS policies
-- ==============================================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'infinitepay',
  order_nsu TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Falha na geração', 'Falha na confirmação')),
  expected_amount BIGINT NOT NULL DEFAULT 0,
  paid_amount BIGINT NOT NULL DEFAULT 0,
  payment_url TEXT,
  invoice_slug TEXT,
  transaction_nsu TEXT UNIQUE,
  capture_method TEXT,
  installments INTEGER DEFAULT 1,
  receipt_url TEXT,
  provider_response JSONB DEFAULT '{}',
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PAYMENT WEBHOOK EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'infinitepay',
  order_nsu TEXT,
  transaction_nsu TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'duplicate')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR FAST QUERYING & IDEMPOTENCY
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_nsu ON public.payments(order_nsu);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_nsu ON public.payments(transaction_nsu);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order_nsu ON public.payment_webhook_events(order_nsu);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status ON public.payment_webhook_events(processing_status);

-- 4. INSERT PAYMENT PERMISSIONS
INSERT INTO public.permissions (module, action, permission_key, description) VALUES
  ('payments', 'view', 'payments.view', 'Visualizar registros e status de pagamentos'),
  ('payments', 'create', 'payments.create', 'Gerar novos links de pagamento InfinitePay'),
  ('payments', 'copy_link', 'payments.copy_link', 'Copiar links de pagamento'),
  ('payments', 'check_status', 'payments.check_status', 'Consultar status oficial de pagamentos na API'),
  ('payments', 'view_financial_data', 'payments.view_financial_data', 'Visualizar relatórios e comprovantes financeiros')
ON CONFLICT (permission_key) DO NOTHING;

-- Grant permissions to admin role by default
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.slug = 'admin' AND p.permission_key LIKE 'payments.%'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth read payments" ON public.payments;
CREATE POLICY "Auth read payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth insert payments" ON public.payments;
CREATE POLICY "Auth insert payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth update payments" ON public.payments;
CREATE POLICY "Auth update payments" ON public.payments FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Webhook events read-only for auth users (creation handled via service role)
DROP POLICY IF EXISTS "Auth read webhook events" ON public.payment_webhook_events;
CREATE POLICY "Auth read webhook events" ON public.payment_webhook_events FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. TRIGGER FOR UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_payments_updated_at ON public.payments;
CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payments_updated_at();

DROP TRIGGER IF EXISTS set_payment_webhook_events_updated_at ON public.payment_webhook_events;
CREATE TRIGGER set_payment_webhook_events_updated_at
  BEFORE UPDATE ON public.payment_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payments_updated_at();
