-- Create scheduled posts table
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT NOT NULL,
  hashtags TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'published', 'draft'
  author_id UUID REFERENCES public.team_members(id),
  client_name TEXT, -- null means it's for the agency itself
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view scheduled posts"
ON public.scheduled_posts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert scheduled posts"
ON public.scheduled_posts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update scheduled posts"
ON public.scheduled_posts
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete scheduled posts"
ON public.scheduled_posts
FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
BEFORE UPDATE ON public.scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();