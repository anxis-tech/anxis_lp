-- ==============================================================================
-- MIGRATION: Primary Super Admin Flag & Database Permission Check Fix
-- ==============================================================================

-- 1. Ensure is_super_admin column exists on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Ensure primary admin email possesses is_super_admin = TRUE
UPDATE public.profiles
SET is_super_admin = TRUE
WHERE email = 'contato@anxis.com.br' OR user_id IN (
  SELECT id FROM auth.users WHERE email = 'contato@anxis.com.br'
);

-- 3. Update SQL check_user_permission function
-- Role/Cargo is strictly organizational and DOES NOT GRANT or BLOCK permissions.
-- Only is_super_admin = TRUE grants full access.
-- All other users check profiles.custom_permissions JSONB.
CREATE OR REPLACE FUNCTION public.check_user_permission(p_user_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_super BOOLEAN;
  v_custom_json JSONB;
  v_perm_val BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 1. Get is_super_admin & custom_permissions from profiles
  SELECT 
    COALESCE(p.is_super_admin, FALSE),
    p.custom_permissions
  INTO 
    v_is_super,
    v_custom_json
  FROM public.profiles p
  WHERE p.user_id = p_user_id AND p.is_active = TRUE;

  -- 2. Primary Super Admin has full access
  IF v_is_super = TRUE THEN
    RETURN TRUE;
  END IF;

  -- 3. Check JSONB custom_permissions if key exists
  IF v_custom_json IS NOT NULL AND v_custom_json ? p_permission_key THEN
    v_perm_val := (v_custom_json->>p_permission_key)::BOOLEAN;
    IF v_perm_val IS NOT NULL THEN
      RETURN v_perm_val;
    END IF;
  END IF;

  -- 4. Check user_permissions table override if present
  SELECT up.is_allowed INTO v_perm_val
  FROM public.user_permissions up
  JOIN public.permissions perm ON up.permission_id = perm.id
  WHERE up.user_id = p_user_id AND perm.permission_key = p_permission_key;

  IF v_perm_val IS NOT NULL THEN
    RETURN v_perm_val;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
