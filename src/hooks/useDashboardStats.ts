import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface DashboardStats {
  pendingApprovalFiles: number;
  approvedFilesToday: number;
  pendingTasks: number;
  completedTasksThisWeek: number;
  totalFiles: number;
  activeRequests: number;
}

export function useDashboardStats() {
  const { profile, isTeamMember } = useAuthContext();

  return useQuery({
    queryKey: ["dashboard-stats", isTeamMember, profile?.company_name],
    queryFn: async () => {
      const stats: DashboardStats = {
        pendingApprovalFiles: 0,
        approvedFilesToday: 0,
        pendingTasks: 0,
        completedTasksThisWeek: 0,
        totalFiles: 0,
        activeRequests: 0,
      };

      // Get pending approval files
      const { count: pendingCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");
      
      stats.pendingApprovalFiles = pendingCount || 0;

      // Get files approved today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: approvedCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("updated_at", today.toISOString());
      
      stats.approvedFilesToday = approvedCount || 0;

      // Get total files
      const { count: totalCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true });
      
      stats.totalFiles = totalCount || 0;

      // Get active requests
      const { count: requestsCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]);
      
      stats.activeRequests = requestsCount || 0;

      // Get pending tasks (requests)
      const { count: pendingTasksCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      stats.pendingTasks = pendingTasksCount || 0;

      // Get completed tasks this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { count: completedCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("updated_at", weekStart.toISOString());
      
      stats.completedTasksThisWeek = completedCount || 0;

      return stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
}
