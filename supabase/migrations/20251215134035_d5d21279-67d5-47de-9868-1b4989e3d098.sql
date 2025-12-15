-- Add assigned_to column to client_requests
ALTER TABLE public.client_requests
ADD COLUMN assigned_to UUID REFERENCES public.team_members(id);

-- Create index for performance
CREATE INDEX idx_client_requests_assigned_to ON public.client_requests(assigned_to);