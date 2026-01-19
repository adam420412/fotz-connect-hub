import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from "date-fns";

export interface AdminKPI {
  // Revenue
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  avgDealValue: number;
  
  // Lead conversion
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  leadsBySource: { source: string; count: number }[];
  
  // Project completion
  avgCompletionDays: number;
  completedThisMonth: number;
  overdueProjects: number;
  onTimeRate: number;
  
  // Team performance
  teamUtilization: number;
  topPerformers: { name: string; tasks: number; hours: number }[];
  
  // Trends
  monthlyTrends: {
    month: string;
    revenue: number;
    leads: number;
    completedProjects: number;
  }[];
}

export function useAdminKPI() {
  return useQuery({
    queryKey: ["admin-kpi"],
    queryFn: async (): Promise<AdminKPI> => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch deals for revenue
      const { data: allDeals } = await supabase
        .from("deals")
        .select("value, stage, created_at");

      const wonDeals = allDeals?.filter((d) => d.stage === "won") || [];
      const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      
      const monthlyWonDeals = wonDeals.filter(
        (d) => new Date(d.created_at) >= thisMonthStart && new Date(d.created_at) <= thisMonthEnd
      );
      const monthlyRevenue = monthlyWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      
      const lastMonthWonDeals = wonDeals.filter(
        (d) => new Date(d.created_at) >= lastMonthStart && new Date(d.created_at) <= lastMonthEnd
      );
      const lastMonthRevenue = lastMonthWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      const avgDealValue = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

      // Lead conversion
      const { data: leads } = await supabase.from("leads").select("status, source, created_at");
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter((l) => l.status === "converted").length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Leads by source
      const sourceMap = new Map<string, number>();
      leads?.forEach((lead) => {
        const source = lead.source || "Nieznane";
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      const leadsBySource = Array.from(sourceMap, ([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Project completion time
      const { data: completedRequests } = await supabase
        .from("client_requests")
        .select("created_at, updated_at, deadline, status")
        .eq("status", "completed");

      const completionTimes = completedRequests?.map((r) => 
        differenceInDays(new Date(r.updated_at), new Date(r.created_at))
      ) || [];
      const avgCompletionDays = completionTimes.length > 0 
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length 
        : 0;

      const completedThisMonth = completedRequests?.filter(
        (r) => new Date(r.updated_at) >= thisMonthStart
      ).length || 0;

      // Overdue projects
      const { data: activeRequests } = await supabase
        .from("client_requests")
        .select("deadline")
        .in("status", ["pending", "in_progress"])
        .not("deadline", "is", null);

      const overdueProjects = activeRequests?.filter(
        (r) => r.deadline && new Date(r.deadline) < now
      ).length || 0;

      const onTimeDeliveries = completedRequests?.filter(
        (r) => !r.deadline || new Date(r.updated_at) <= new Date(r.deadline)
      ).length || 0;
      const onTimeRate = completedRequests?.length 
        ? (onTimeDeliveries / completedRequests.length) * 100 
        : 100;

      // Team utilization (based on time tracking)
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("duration_minutes, user_id")
        .gte("created_at", thisMonthStart.toISOString());

      const { data: teamMembers } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("is_active", true);

      const workingDays = 22; // Average working days per month
      const hoursPerDay = 8;
      const expectedMinutes = (teamMembers?.length || 1) * workingDays * hoursPerDay * 60;
      const actualMinutes = timeEntries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
      const teamUtilization = Math.min((actualMinutes / expectedMinutes) * 100, 100);

      // Top performers
      const memberStats = new Map<string, { tasks: number; hours: number }>();
      
      const { data: assignedTasks } = await supabase
        .from("client_requests")
        .select("assigned_to, status")
        .eq("status", "completed")
        .gte("updated_at", thisMonthStart.toISOString());

      assignedTasks?.forEach((task) => {
        if (task.assigned_to) {
          const current = memberStats.get(task.assigned_to) || { tasks: 0, hours: 0 };
          current.tasks += 1;
          memberStats.set(task.assigned_to, current);
        }
      });

      timeEntries?.forEach((entry) => {
        const current = memberStats.get(entry.user_id) || { tasks: 0, hours: 0 };
        current.hours += (entry.duration_minutes || 0) / 60;
        memberStats.set(entry.user_id, current);
      });

      const topPerformers = teamMembers
        ?.map((m) => ({
          name: m.name,
          tasks: memberStats.get(m.id)?.tasks || 0,
          hours: Math.round((memberStats.get(m.id)?.hours || 0) * 10) / 10,
        }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 5) || [];

      // Monthly trends (last 6 months)
      const monthlyTrends = await Promise.all(
        Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i)).map(async (month) => {
          const start = startOfMonth(month);
          const end = endOfMonth(month);

          const { data: monthDeals } = await supabase
            .from("deals")
            .select("value")
            .eq("stage", "won")
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());

          const { count: monthLeads } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .gte("created_at", start.toISOString())
            .lte("created_at", end.toISOString());

          const { count: monthCompleted } = await supabase
            .from("client_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed")
            .gte("updated_at", start.toISOString())
            .lte("updated_at", end.toISOString());

          return {
            month: format(month, "MMM"),
            revenue: monthDeals?.reduce((sum, d) => sum + (d.value || 0), 0) || 0,
            leads: monthLeads || 0,
            completedProjects: monthCompleted || 0,
          };
        })
      );

      return {
        totalRevenue,
        monthlyRevenue,
        revenueGrowth,
        avgDealValue,
        totalLeads,
        convertedLeads,
        conversionRate,
        leadsBySource,
        avgCompletionDays: Math.round(avgCompletionDays),
        completedThisMonth,
        overdueProjects,
        onTimeRate: Math.round(onTimeRate),
        teamUtilization: Math.round(teamUtilization),
        topPerformers,
        monthlyTrends,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
