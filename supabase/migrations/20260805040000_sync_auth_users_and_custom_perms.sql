-- ==============================================================================
-- MIGRATION: Sync all auth.users to public.profiles and support custom_permissions
-- ==============================================================================

-- 1. Ensure custom_permissions JSONB column exists on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '{}'::jsonb;

-- 2. Sync all existing users in auth.users into public.profiles
INSERT INTO public.profiles (user_id, full_name, email, is_active, custom_permissions)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
  u.email,
  TRUE,
  '{}'::jsonb
FROM auth.users u
ON CONFLICT (user_id) DO UPDATE
SET 
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- 3. Update handle_new_user trigger to ensure future users get created in profiles automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role_id, is_active, custom_permissions)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NULL,  -- Default: No role assigned. Sees only Dashboard until admin sets role/permissions.
    TRUE,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    last_access_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
