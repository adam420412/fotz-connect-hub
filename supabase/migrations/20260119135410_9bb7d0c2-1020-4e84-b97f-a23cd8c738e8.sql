-- Add project_id column to client_requests to link tasks to projects
ALTER TABLE public.client_requests 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_client_requests_project_id ON public.client_requests(project_id);