-- ==============================================================================
-- FIX: handle_new_user trigger and RLS policies for profiles
-- 
-- Changes:
-- 1. New users created via Auth NO LONGER get auto-assigned 'admin' role
--    They are created with role_id = NULL (no role assigned)
-- 2. Admins must manually assign roles via the admin panel
-- 3. Enhanced RLS: admins can see all profiles; users see only their own
-- 4. Only admins can update role_id on profiles
-- ==============================================================================

-- 1. FIX: handle_new_user trigger - DO NOT auto-assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role_id, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NULL,  -- No role assigned by default. Admin must assign via panel or SQL.
    TRUE
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    last_access_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. ENHANCED RLS POLICIES FOR PROFILES

-- Drop existing policies
DROP POLICY IF EXISTS "Auth read profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Admins can see all profiles; non-admins see only their own
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.check_user_permission(auth.uid(), 'users.view')
  );

-- Users can update their own profile (except role_id)
-- This policy allows self-updates to non-sensitive fields
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
    -- Prevent self role change: role_id must remain unchanged for non-admins
    AND (
      role_id IS NOT DISTINCT FROM (SELECT p.role_id FROM public.profiles p WHERE p.user_id = auth.uid())
      OR public.check_user_permission(auth.uid(), 'users.manage_roles')
    )
  );

-- Admins can update any profile (including role_id)
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    public.check_user_permission(auth.uid(), 'users.edit')
  );

-- Admins can insert profiles (for user creation via panel)
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
CREATE POLICY "profiles_admin_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    public.check_user_permission(auth.uid(), 'users.create')
    OR auth.uid() = user_id  -- Allow trigger/self-creation
  );

-- 3. ROLES TABLE: Read-only for authenticated, write for admins
DROP POLICY IF EXISTS "roles_select" ON public.roles;
CREATE POLICY "roles_select" ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "roles_admin_write" ON public.roles;
CREATE POLICY "roles_admin_write" ON public.roles
  FOR ALL USING (public.check_user_permission(auth.uid(), 'users.manage_roles'));

-- 4. PERMISSIONS TABLE: Read-only for authenticated
DROP POLICY IF EXISTS "permissions_select" ON public.permissions;
CREATE POLICY "permissions_select" ON public.permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. ROLE_PERMISSIONS TABLE: Read-only for authenticated
DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. SITE CONTENT TABLES: Read for public, write for admins

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  benefits TEXT[] DEFAULT '{}',
  link TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (TRUE);

-- Site settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  primary_cta_label TEXT,
  primary_cta_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT USING (TRUE);

-- Technologies table
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  category TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technologies_public_read" ON public.technologies;
CREATE POLICY "technologies_public_read" ON public.technologies
  FOR SELECT USING (TRUE);

-- Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  content TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_public_read" ON public.testimonials;
CREATE POLICY "testimonials_public_read" ON public.testimonials
  FOR SELECT USING (TRUE);

-- FAQ items table
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faq_items_public_read" ON public.faq_items;
CREATE POLICY "faq_items_public_read" ON public.faq_items
  FOR SELECT USING (TRUE);
