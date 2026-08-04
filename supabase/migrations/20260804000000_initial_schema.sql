-- ANXIS Initial Database Schema and RLS Policies (100% Idempotent)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'ANXIS',
  logo_light_url TEXT DEFAULT '/images/logo-light.svg',
  logo_dark_url TEXT DEFAULT '/images/logo-dark.svg',
  email TEXT DEFAULT 'contato@anxis.com.br',
  phone TEXT DEFAULT '(11) 99999-9999',
  whatsapp TEXT DEFAULT '5511999999999',
  address TEXT DEFAULT 'São Paulo, SP - Brasil',
  social_links JSONB DEFAULT '{"instagram": "https://instagram.com/anxis", "linkedin": "https://linkedin.com/company/anxis"}'::jsonb,
  primary_cta_label TEXT DEFAULT 'Solicitar uma proposta',
  primary_cta_url TEXT DEFAULT '#contato',
  gtm_id TEXT,
  meta_pixel_id TEXT,
  google_ads_id TEXT,
  custom_head_code TEXT,
  custom_body_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PAGE SECTIONS (Editable section titles and descriptions)
CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT,
  content_json JSONB DEFAULT '{}'::jsonb,
  display_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROJECTS / PORTFOLIO
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  client TEXT,
  slug TEXT UNIQUE,
  category TEXT NOT NULL, -- 'institucional', 'e-commerce', 'landing-page', 'personalizado'
  short_description TEXT NOT NULL,
  full_description TEXT,
  desktop_image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  client_logo_url TEXT,
  project_url TEXT,
  button_label TEXT DEFAULT 'Ver Projeto',
  open_new_tab BOOLEAN DEFAULT TRUE,
  technologies TEXT[] DEFAULT '{}',
  year TEXT DEFAULT '2026',
  accent_color TEXT DEFAULT '#0075FF',
  image_alt TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TECHNOLOGIES & PLATFORMS
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  category TEXT DEFAULT 'Plataforma',
  website_url TEXT,
  image_alt TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon identifier
  benefits TEXT[] DEFAULT '{}',
  link TEXT DEFAULT '#contato',
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT,
  photo_url TEXT,
  content TEXT NOT NULL,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FAQ ITEMS
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. LEADS (Captured contacts with UTM tracking)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  project_type TEXT NOT NULL,
  current_platform TEXT,
  budget_range TEXT,
  desired_deadline TEXT,
  message TEXT,
  consent BOOLEAN NOT NULL DEFAULT TRUE,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  gclid TEXT,
  fbclid TEXT,
  landing_page TEXT,
  referrer TEXT,
  status TEXT DEFAULT 'novo', -- 'novo', 'em_atendimento', 'convertido', 'arquivado'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ADMIN PROFILES
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (IDEMPOTENT)
-- ========================================================

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public READ policies (Visitors can read visible content)
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read page_sections" ON public.page_sections;
CREATE POLICY "Public read page_sections" ON public.page_sections FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Public read projects" ON public.projects;
CREATE POLICY "Public read projects" ON public.projects FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Public read technologies" ON public.technologies;
CREATE POLICY "Public read technologies" ON public.technologies FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Public read services" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Public read testimonials" ON public.testimonials;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Public read faq_items" ON public.faq_items;
CREATE POLICY "Public read faq_items" ON public.faq_items FOR SELECT USING (is_visible = true);

-- Public INSERT policy for leads (Anyone can submit a proposal)
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
CREATE POLICY "Public insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Admin ALL policies (Admins have full CRUD control)
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
CREATE POLICY "Admin full access site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access page_sections" ON public.page_sections;
CREATE POLICY "Admin full access page_sections" ON public.page_sections FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access projects" ON public.projects;
CREATE POLICY "Admin full access projects" ON public.projects FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access technologies" ON public.technologies;
CREATE POLICY "Admin full access technologies" ON public.technologies FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access services" ON public.services;
CREATE POLICY "Admin full access services" ON public.services FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;
CREATE POLICY "Admin full access testimonials" ON public.testimonials FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access faq_items" ON public.faq_items;
CREATE POLICY "Admin full access faq_items" ON public.faq_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access leads" ON public.leads;
CREATE POLICY "Admin full access leads" ON public.leads FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin full access admin_profiles" ON public.admin_profiles;
CREATE POLICY "Admin full access admin_profiles" ON public.admin_profiles FOR ALL USING (public.is_admin());
