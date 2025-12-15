-- Create categories table for reusable task categories
CREATE TABLE public.task_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON public.task_categories
  FOR SELECT USING (true);

-- Team members can manage categories
CREATE POLICY "Team members can manage categories" ON public.task_categories
  FOR ALL USING (is_team_member(auth.uid()));

-- Add category_id to client_requests
ALTER TABLE public.client_requests 
ADD COLUMN category_id UUID REFERENCES public.task_categories(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_client_requests_category ON public.client_requests(category_id);

-- Insert some default categories
INSERT INTO public.task_categories (name, color) VALUES
  ('Design', '#8b5cf6'),
  ('Development', '#3b82f6'),
  ('Marketing', '#ec4899'),
  ('Content', '#f59e0b'),
  ('Social Media', '#10b981'),
  ('Branding', '#6366f1'),
  ('SEO', '#14b8a6'),
  ('Inne', '#6b7280');