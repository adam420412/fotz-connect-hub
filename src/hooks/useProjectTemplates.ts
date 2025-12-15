import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type TemplateItemType = "task" | "folder";
export type TemplatePriority = "low" | "normal" | "high" | "urgent";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplateItem {
  id: string;
  template_id: string;
  item_type: TemplateItemType;
  name: string;
  description: string | null;
  priority: TemplatePriority;
  estimated_days: number | null;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
}

export interface TemplateWithItems extends ProjectTemplate {
  items: ProjectTemplateItem[];
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
}

export interface CreateTemplateItemData {
  template_id: string;
  item_type: TemplateItemType;
  name: string;
  description?: string;
  priority?: TemplatePriority;
  estimated_days?: number;
  sort_order?: number;
  parent_id?: string;
}

export function useProjectTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["project-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (templateData: CreateTemplateData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_templates")
        .insert({
          ...templateData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast({
        title: "Szablon utworzony",
        description: "Nowy szablon projektu został dodany",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć szablonu",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast({
        title: "Zaktualizowano",
        description: "Szablon został zaktualizowany",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast({
        title: "Usunięto",
        description: "Szablon został usunięty",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutate,
    updateTemplate: updateTemplate.mutate,
    deleteTemplate: deleteTemplate.mutate,
    isCreating: createTemplate.isPending,
  };
}

export function useTemplateItems(templateId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["template-items", templateId],
    queryFn: async () => {
      if (!templateId) return [];

      const { data, error } = await supabase
        .from("project_template_items")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProjectTemplateItem[];
    },
    enabled: !!templateId,
  });

  const createItem = useMutation({
    mutationFn: async (itemData: CreateTemplateItemData) => {
      const { data, error } = await supabase
        .from("project_template_items")
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-items", templateId] });
      toast({
        title: "Element dodany",
        description: "Nowy element został dodany do szablonu",
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTemplateItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_template_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-items", templateId] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_template_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template-items", templateId] });
      toast({
        title: "Usunięto",
        description: "Element został usunięty",
      });
    },
  });

  const tasks = items.filter((item) => item.item_type === "task");
  const folders = items.filter((item) => item.item_type === "folder");

  return {
    items,
    tasks,
    folders,
    isLoading,
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
    isCreating: createItem.isPending,
  };
}

export const priorityConfig: Record<TemplatePriority, { label: string; color: string }> = {
  low: { label: "Niski", color: "bg-slate-100 text-slate-700" },
  normal: { label: "Normalny", color: "bg-blue-100 text-blue-700" },
  high: { label: "Wysoki", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Pilny", color: "bg-red-100 text-red-700" },
};
