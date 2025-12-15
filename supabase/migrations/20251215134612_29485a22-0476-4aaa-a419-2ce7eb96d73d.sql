-- Add deadline column to client_requests
ALTER TABLE public.client_requests 
ADD COLUMN deadline DATE NULL;

-- Add index for deadline queries
CREATE INDEX idx_client_requests_deadline ON public.client_requests(deadline);

-- Add reminder_sent column to track if reminder was sent
ALTER TABLE public.client_requests 
ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT false;