-- Create file comments table
CREATE TABLE public.file_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  author_role TEXT NOT NULL DEFAULT 'client', -- 'client' or 'team'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- Policies for file comments
CREATE POLICY "Anyone can view file comments"
ON public.file_comments
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert file comments"
ON public.file_comments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete own comments"
ON public.file_comments
FOR DELETE
USING (true);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_comments;