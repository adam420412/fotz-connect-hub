-- Fix RLS Policies for better security

-- 1. notification_preferences - restrict to team and own preferences
DROP POLICY IF EXISTS "Anyone can manage preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Anyone can view preferences" ON public.notification_preferences;

CREATE POLICY "Team can manage all preferences"
ON public.notification_preferences FOR ALL
USING (is_team_member(auth.uid()));

CREATE POLICY "Users can view their own preferences"
ON public.notification_preferences FOR SELECT
USING (client_email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- 2. project_files - restrict to team and project participants
DROP POLICY IF EXISTS "Anyone can insert files" ON public.project_files;
DROP POLICY IF EXISTS "Anyone can update files" ON public.project_files;
DROP POLICY IF EXISTS "Anyone can view files" ON public.project_files;

CREATE POLICY "Team can manage files"
ON public.project_files FOR ALL
USING (is_team_member(auth.uid()));

CREATE POLICY "Clients can view files from their projects"
ON public.project_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = project_files.project_id
    AND p.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can insert files to their projects"
ON public.project_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id::text = project_files.project_id
    AND p.client_id = auth.uid()
  )
);

-- 3. file_comments - restrict to team and file owners
DROP POLICY IF EXISTS "Anyone can delete own comments" ON public.file_comments;
DROP POLICY IF EXISTS "Anyone can insert file comments" ON public.file_comments;
DROP POLICY IF EXISTS "Anyone can view file comments" ON public.file_comments;

CREATE POLICY "Team can view all file comments"
ON public.file_comments FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team can insert file comments"
ON public.file_comments FOR INSERT
WITH CHECK (is_team_member(auth.uid()) OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own comments"
ON public.file_comments FOR DELETE
USING (author_email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Clients can view comments on their files"
ON public.file_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_files pf
    JOIN projects p ON p.id::text = pf.project_id
    WHERE pf.id = file_comments.file_id
    AND p.client_id = auth.uid()
  )
);

-- 4. daily_post_assignments - restrict to team only
DROP POLICY IF EXISTS "Anyone can manage daily assignments" ON public.daily_post_assignments;
DROP POLICY IF EXISTS "Anyone can view daily assignments" ON public.daily_post_assignments;

CREATE POLICY "Team can view daily assignments"
ON public.daily_post_assignments FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team can manage daily assignments"
ON public.daily_post_assignments FOR ALL
USING (is_team_member(auth.uid()));

-- 5. team_members - restrict viewing to team members and authenticated users
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

CREATE POLICY "Team can view team members"
ON public.team_members FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage team members"
ON public.team_members FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 6. marketing_news - restrict management to admins
DROP POLICY IF EXISTS "System can manage news" ON public.marketing_news;

CREATE POLICY "Admins can manage news"
ON public.marketing_news FOR ALL
USING (has_role(auth.uid(), 'admin'));