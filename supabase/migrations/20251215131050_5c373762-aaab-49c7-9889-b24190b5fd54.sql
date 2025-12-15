-- Create team calendar events table
CREATE TABLE public.team_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('vacation', 'availability', 'deadline', 'meeting', 'other')),
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT,
  color TEXT DEFAULT '#3b82f6',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_calendar_events ENABLE ROW LEVEL SECURITY;

-- Team members can view all events
CREATE POLICY "Team members can view all calendar events"
ON public.team_calendar_events
FOR SELECT
USING (is_team_member(auth.uid()));

-- Team members can create events
CREATE POLICY "Team members can create calendar events"
ON public.team_calendar_events
FOR INSERT
WITH CHECK (is_team_member(auth.uid()));

-- Team members can update their own events or admins can update all
CREATE POLICY "Team members can update own events"
ON public.team_calendar_events
FOR UPDATE
USING (
  is_team_member(auth.uid()) AND (
    auth.uid() = user_id OR 
    auth.uid() = created_by OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Admins and managers can delete events
CREATE POLICY "Admins can delete calendar events"
ON public.team_calendar_events
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  auth.uid() = created_by
);

-- Create trigger for updated_at
CREATE TRIGGER update_team_calendar_events_updated_at
  BEFORE UPDATE ON public.team_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();