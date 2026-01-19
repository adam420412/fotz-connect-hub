import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectActivity {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  user_id: string | null;
  user_email: string | null;
  details: any;
  created_at: string;
}

export function useProjectActivity(projectId?: string) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["project-activity", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get activities related to this project
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as ProjectActivity[];
    },
    enabled: !!projectId,
  });

  return {
    activities,
    isLoading,
  };
}