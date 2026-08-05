-- ==============================================================================
-- SCRIPT: Define o primeiro Administrador do sistema
-- 
-- INSTRUÇÕES:
-- 1. Substitua 'SEU_EMAIL_AQUI@exemplo.com' pelo e-mail real do administrador
-- 2. O usuário DEVE existir em Supabase Auth > Authentication > Users
-- 3. Execute este script diretamente no SQL Editor do Supabase Dashboard
-- 4. Se o usuário não existir, o script retornará um erro claro
-- ==============================================================================

DO $$
DECLARE
  -- ╔═══════════════════════════════════════════════════════════╗
  -- ║  ALTERE AQUI: insira o e-mail do administrador real      ║
  -- ╚═══════════════════════════════════════════════════════════╝
  v_admin_email TEXT := 'SEU_EMAIL_AQUI@exemplo.com';
  
  v_user_id UUID;
  v_admin_role_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- 1. Verificar se o usuário existe em auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ ERRO: O e-mail "%" NÃO foi encontrado em auth.users. '
      'Crie o usuário primeiro em Supabase Auth > Authentication > Users antes de executar este script.',
      v_admin_email;
  END IF;

  -- 2. Buscar o ID do cargo Administrador
  SELECT id INTO v_admin_role_id
  FROM public.roles
  WHERE slug = 'admin';

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ ERRO: O cargo "admin" não existe na tabela roles. '
      'Execute a migration principal primeiro (20260805010000_master_clean_schema.sql).';
  END IF;

  -- 3. Verificar se já existe um perfil para este usuário
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE user_id = v_user_id
  ) INTO v_profile_exists;

  IF v_profile_exists THEN
    -- Atualizar o perfil existente
    UPDATE public.profiles
    SET 
      role_id = v_admin_role_id,
      is_active = TRUE,
      updated_at = NOW()
    WHERE user_id = v_user_id;

    RAISE NOTICE '✅ Perfil existente atualizado. Usuário "%" agora é Administrador.', v_admin_email;
  ELSE
    -- Criar novo perfil
    INSERT INTO public.profiles (user_id, full_name, email, role_id, is_active)
    SELECT 
      v_user_id,
      COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
      u.email,
      v_admin_role_id,
      TRUE
    FROM auth.users u
    WHERE u.id = v_user_id;

    RAISE NOTICE '✅ Novo perfil criado. Usuário "%" definido como Administrador.', v_admin_email;
  END IF;

  -- 4. Confirmação final
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '  Administrador configurado com sucesso!';
  RAISE NOTICE '  E-mail: %', v_admin_email;
  RAISE NOTICE '  User ID: %', v_user_id;
  RAISE NOTICE '  Role ID: %', v_admin_role_id;
  RAISE NOTICE '══════════════════════════════════════════════════';
END $$;
