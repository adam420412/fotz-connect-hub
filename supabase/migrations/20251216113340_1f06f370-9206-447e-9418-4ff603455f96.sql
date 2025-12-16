
-- Table for storing Google Calendar integration tokens
CREATE TABLE public.google_calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamp with time zone NOT NULL,
  calendar_id text DEFAULT 'primary',
  sync_enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamp with time zone,
  sync_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for tracking synced events
CREATE TABLE public.google_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id text NOT NULL,
  local_entity_type text NOT NULL, -- 'task', 'calendar_event'
  local_entity_id uuid NOT NULL,
  last_synced_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_event_id),
  UNIQUE(user_id, local_entity_type, local_entity_id)
);

-- Enable RLS
ALTER TABLE public.google_calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_calendar_integrations
CREATE POLICY "Users can view their own integration"
ON public.google_calendar_integrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own integration"
ON public.google_calendar_integrations FOR ALL
USING (auth.uid() = user_id);

-- RLS policies for google_calendar_events
CREATE POLICY "Users can view their own synced events"
ON public.google_calendar_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced events"
ON public.google_calendar_events FOR ALL
USING (auth.uid() = user_id);

-- Trigger for updating timestamp
CREATE TRIGGER update_google_calendar_integrations_updated_at
BEFORE UPDATE ON public.google_calendar_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
