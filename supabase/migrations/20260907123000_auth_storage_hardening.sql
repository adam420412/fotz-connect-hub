BEGIN;

-- Invitations contain bearer tokens and privileged roles. They must only be
-- visible and managed by administrators.
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Team members can manage invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

CREATE POLICY "Admins can manage invitations"
ON public.invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Reject direct sign-ups. A new auth user is accepted only when the request
-- carries an unused, unexpired token issued for the same email address.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  invitation_record public.invitations%ROWTYPE;
  invitation_token text;
BEGIN
  invitation_token := NULLIF(
    pg_catalog.btrim(NEW.raw_user_meta_data ->> 'invite_token'),
    ''
  );

  IF NEW.email IS NULL OR invitation_token IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVITATION_REQUIRED';
  END IF;

  SELECT invitation.*
  INTO invitation_record
  FROM public.invitations AS invitation
  WHERE invitation.token = invitation_token
    AND pg_catalog.lower(pg_catalog.btrim(invitation.email)) =
      pg_catalog.lower(pg_catalog.btrim(NEW.email))
    AND invitation.used_at IS NULL
    AND invitation.expires_at > pg_catalog.now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INVITATION_REQUIRED';
  END IF;

  UPDATE public.invitations
  SET used_at = pg_catalog.now()
  WHERE id = invitation_record.id;

  INSERT INTO public.profiles (id, email, full_name, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(
      pg_catalog.btrim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')),
      ''
    ),
    invitation_record.company_name
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, invitation_record.role);

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Replace bucket-wide access with project ownership and a per-user namespace
-- for brief attachments. Service-role operations continue to bypass RLS.
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their files" ON storage.objects;
DROP POLICY IF EXISTS "Team can manage project storage" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own project storage" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload to own project storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own brief attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own brief attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own brief attachments" ON storage.objects;

CREATE POLICY "Team can manage project storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-files'
  AND public.is_team_member(auth.uid())
)
WITH CHECK (
  bucket_id = 'project-files'
  AND public.is_team_member(auth.uid())
);

CREATE POLICY "Clients can view own project storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id::text = (storage.foldername(name))[1]
      AND project.client_id = auth.uid()
  )
);

CREATE POLICY "Clients can upload to own project storage"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1
    FROM public.projects AS project
    WHERE project.id::text = (storage.foldername(name))[1]
      AND project.client_id = auth.uid()
  )
  AND owner_id = (SELECT auth.uid())::text
);

CREATE POLICY "Users can view own brief attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (
    (
      (storage.foldername(name))[1] = 'brief-attachments'
      AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
    )
    OR (
      (storage.foldername(name))[1] = 'brief-attachments'
      AND pg_catalog.array_length(storage.foldername(name), 1) = 1
      AND owner_id = (SELECT auth.uid())::text
    )
  )
);

CREATE POLICY "Users can upload own brief attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = 'brief-attachments'
  AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  AND owner_id = (SELECT auth.uid())::text
);

CREATE POLICY "Users can delete own brief attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = 'brief-attachments'
  AND owner_id = (SELECT auth.uid())::text
  AND (
    (storage.foldername(name))[2] = (SELECT auth.uid())::text
    OR pg_catalog.array_length(storage.foldername(name), 1) = 1
  )
);

COMMIT;
