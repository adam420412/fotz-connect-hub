-- Create file_folders table for organizing files by event/date
CREATE TABLE public.file_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    event_date DATE,
    description TEXT,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder reference to project_files
ALTER TABLE public.project_files ADD COLUMN folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL;

-- Create time_entries table for time tracking
CREATE TABLE public.time_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id TEXT,
    task_id UUID,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    is_running BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- File folders policies
CREATE POLICY "Team can manage all folders"
ON public.file_folders FOR ALL
USING (is_team_member(auth.uid()));

CREATE POLICY "Clients can view their own folders"
ON public.file_folders FOR SELECT
USING (auth.uid() = client_id);

-- Time entries policies (only team members)
CREATE POLICY "Team members can manage their own time entries"
ON public.time_entries FOR ALL
USING (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Team members can view all time entries"
ON public.time_entries FOR SELECT
USING (is_team_member(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_file_folders_updated_at
BEFORE UPDATE ON public.file_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
BEFORE UPDATE ON public.time_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();