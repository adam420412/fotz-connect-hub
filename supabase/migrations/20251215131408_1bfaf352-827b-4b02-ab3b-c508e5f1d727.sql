-- Create project templates table
CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template items table (tasks and folders)
CREATE TABLE public.project_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'folder')),
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_days INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.project_template_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_template_items ENABLE ROW LEVEL SECURITY;

-- Team members can view all templates
CREATE POLICY "Team members can view templates"
ON public.project_templates
FOR SELECT
USING (is_team_member(auth.uid()));

-- Team members can create templates
CREATE POLICY "Team members can create templates"
ON public.project_templates
FOR INSERT
WITH CHECK (is_team_member(auth.uid()));

-- Admins and managers can update templates
CREATE POLICY "Admins can update templates"
ON public.project_templates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR auth.uid() = created_by);

-- Admins can delete templates
CREATE POLICY "Admins can delete templates"
ON public.project_templates
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by);

-- Template items policies
CREATE POLICY "Team members can view template items"
ON public.project_template_items
FOR SELECT
USING (is_team_member(auth.uid()));

CREATE POLICY "Team members can manage template items"
ON public.project_template_items
FOR ALL
USING (is_team_member(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();