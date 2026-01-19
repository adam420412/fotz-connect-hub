import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectStats {
  projectId: string;
  totalTimeMinutes: number;
  taskCount: number;
  completedTasks: number;
  pendingTasks: number;
  memberCount: number;
}

export function useProjectStats(projectId?: string) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["project-stats", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get time entries for this project
      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("duration_minutes")
        .eq("project_id", projectId);

      if (timeError) throw timeError;

      // Get project members count
      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("is_active", true);

      if (membersError) throw membersError;

      // Calculate totals
      const totalTimeMinutes = (timeEntries || []).reduce(
        (sum, entry) => sum + (entry.duration_minutes || 0),
        0
      );

      return {
        projectId,
        totalTimeMinutes,
        memberCount: members?.length || 0,
        taskCount: 0, // Will be calculated from client_requests if linked
        completedTasks: 0,
        pendingTasks: 0,
      } as ProjectStats;
    },
    enabled: !!projectId,
  });

  const { data: allProjectStats = [] } = useQuery({
    queryKey: ["all-project-stats"],
    queryFn: async () => {
      // Get all projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id");

      if (projectsError) throw projectsError;

      // Get all time entries
      const { data: timeEntries, error: timeError } = await supabase
        .from("time_entries")
        .select("project_id, duration_minutes");

      if (timeError) throw timeError;

      // Get all project members
      const { data: members, error: membersError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("is_active", true);

      if (membersError) throw membersError;

      // Calculate stats per project
      const statsMap = new Map<string, ProjectStats>();

      (projects || []).forEach((project) => {
        const projectTimeEntries = (timeEntries || []).filter(
          (e) => e.project_id === project.id
        );
        const projectMembers = (members || []).filter(
          (m) => m.project_id === project.id
        );

        statsMap.set(project.id, {
          projectId: project.id,
          totalTimeMinutes: projectTimeEntries.reduce(
            (sum, e) => sum + (e.duration_minutes || 0),
            0
          ),
          memberCount: projectMembers.length,
          taskCount: 0,
          completedTasks: 0,
          pendingTasks: 0,
        });
      });

      return Array.from(statsMap.values());
    },
  });

  const getStatsForProject = (id: string) => {
    return allProjectStats.find((s) => s.projectId === id);
  };

  return {
    stats,
    allProjectStats,
    getStatsForProject,
    isLoading,
  };
}
