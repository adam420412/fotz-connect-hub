import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  deadline: string | null;
  assigned_to: string | null;
  project_id: string | null;
  created_at: string;
  assigned_member?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

export function useProjectTasks(projectId?: string) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          deadline,
          assigned_to,
          project_id,
          created_at,
          assigned_member:team_members!client_requests_assigned_to_fkey(
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!projectId,
  });

  return {
    tasks,
    isLoading,
  };
}