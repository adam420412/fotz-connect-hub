-- Create table for request comments
CREATE TABLE public.request_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.client_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'client',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments on requests they have access to
CREATE POLICY "Users can view request comments"
ON public.request_comments
FOR SELECT
USING (
  -- Team members can see all comments
  is_team_member(auth.uid())
  OR
  -- Clients can see comments on their own requests
  EXISTS (
    SELECT 1 FROM public.client_requests 
    WHERE id = request_id AND client_id = auth.uid()
  )
);

-- Policy: Users can create comments on requests they have access to
CREATE POLICY "Users can create request comments"
ON public.request_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    is_team_member(auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.client_requests 
      WHERE id = request_id AND client_id = auth.uid()
    )
  )
);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.request_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_request_comments_request_id ON public.request_comments(request_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_comments;