-- Fix RLS Policies for client_projects, client_project_links, and client_project_files

-- 1. Client Projects Table RLS
DROP POLICY IF EXISTS "Auth read client_projects" ON public.client_projects;
CREATE POLICY "Auth read client_projects" ON public.client_projects FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    public.check_user_permission(auth.uid(), 'client_projects.view_all')
    OR public.check_user_permission(auth.uid(), 'client_projects.view')
    OR responsible_user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.client_project_participants WHERE project_id = public.client_projects.id AND user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Auth write client_projects" ON public.client_projects;
CREATE POLICY "Auth write client_projects" ON public.client_projects FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    public.check_user_permission(auth.uid(), 'client_projects.edit')
    OR public.check_user_permission(auth.uid(), 'client_projects.create')
    OR responsible_user_id = auth.uid()
  )
);

-- 2. Client Project Links Table RLS
DROP POLICY IF EXISTS "Auth write client_project_links" ON public.client_project_links;
CREATE POLICY "Auth write client_project_links" ON public.client_project_links FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- 3. Client Project Files Table RLS
DROP POLICY IF EXISTS "Auth write client_project_files" ON public.client_project_files;
CREATE POLICY "Auth write client_project_files" ON public.client_project_files FOR ALL USING (
  auth.uid() IS NOT NULL
);

-- 4. Client Project Participants Table RLS
DROP POLICY IF EXISTS "Auth write client_project_participants" ON public.client_project_participants;
CREATE POLICY "Auth write client_project_participants" ON public.client_project_participants FOR ALL USING (
  auth.uid() IS NOT NULL
);
