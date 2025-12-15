-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- Enable RLS on storage.objects for this bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can view files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');

-- Create files metadata table for versioning
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  project_id TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  parent_file_id UUID REFERENCES public.project_files(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for files metadata
CREATE POLICY "Anyone can view files"
ON public.project_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can insert files"
ON public.project_files FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update files"
ON public.project_files FOR UPDATE
TO authenticated
USING (true);

-- Create team members table for daily post rotation
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members"
ON public.team_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (true);

-- Create daily post assignments table
CREATE TABLE public.daily_post_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id),
  ai_suggestions JSONB,
  post_created BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_post_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily assignments"
ON public.daily_post_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can manage daily assignments"
ON public.daily_post_assignments FOR ALL
TO authenticated
USING (true);

-- Create marketing news table
CREATE TABLE public.marketing_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  category TEXT NOT NULL,
  relevance_score INTEGER DEFAULT 5,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view marketing news"
ON public.marketing_news FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can manage news"
ON public.marketing_news FOR ALL
TO authenticated
USING (true);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  notify_on_task_complete BOOLEAN NOT NULL DEFAULT true,
  notify_on_file_upload BOOLEAN NOT NULL DEFAULT true,
  notify_on_status_change BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can manage preferences"
ON public.notification_preferences FOR ALL
TO authenticated
USING (true);

-- Insert sample team members
INSERT INTO public.team_members (name, email, role) VALUES
('Anna Kowalska', 'anna.k@fotz.pl', 'Senior Designer'),
('Michał Piotrowski', 'michal.p@fotz.pl', 'Project Manager'),
('Ewa Szymańska', 'ewa.s@fotz.pl', 'Graphic Designer'),
('Piotr Nowak', 'piotr.n@fotz.pl', 'Web Developer'),
('Tomek Wiśniewski', 'tomek.w@fotz.pl', 'Video Editor'),
('Kasia Mazur', 'kasia.m@fotz.pl', 'Content Writer');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_project_files_updated_at
BEFORE UPDATE ON public.project_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();