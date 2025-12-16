
-- Table for team member project assignments
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(project_id, user_id)
);

-- Table for team member hourly rates (set by admin)
CREATE TABLE public.team_member_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  hourly_rate decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PLN',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_rates ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_members
CREATE POLICY "Team members can view project members"
ON public.project_members FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members can join projects"
ON public.project_members FOR INSERT
WITH CHECK (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Team members can leave projects"
ON public.project_members FOR DELETE
USING (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Admins can manage all project members"
ON public.project_members FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for team_member_rates
CREATE POLICY "Team members can view their own rate"
ON public.team_member_rates FOR SELECT
USING (is_team_member(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Admins can view all rates"
ON public.team_member_rates FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all rates"
ON public.team_member_rates FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updating timestamp
CREATE TRIGGER update_team_member_rates_updated_at
BEFORE UPDATE ON public.team_member_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
