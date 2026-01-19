import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  status: "active" | "paused" | "completed";
  due_date: string | null;
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: "active" | "paused" | "completed";
  due_date?: string;
  client_id?: string;
}

export interface UpdateProjectData {
  id: string;
  name?: string;
  description?: string;
  progress?: number;
  status?: "active" | "paused" | "completed";
  due_date?: string;
  client_id?: string;
}

export function useProjects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description || null,
          status: data.status || "active",
          due_date: data.due_date || null,
          client_id: data.client_id || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projekt utworzony",
        description: `Projekt "${data.name}" został dodany`,
      });
      logActivity("project_create", "project", data.id, data.name);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const { id, ...updateData } = data;
      const { data: project, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projekt zaktualizowany",
        description: `Projekt "${data.name}" został zaktualizowany`,
      });
      logActivity("project_update", "project", data.id, data.name);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Projekt usunięty",
      });
      logActivity("project_delete", "project", id);
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    deleteProject: deleteProject.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
  };
}
