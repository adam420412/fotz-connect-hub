import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from "date-fns";
import { pl } from "date-fns/locale";

interface TeamMemberStats {
  id: string;
  name: string;
  role: string;
  totalMinutes: number;
  tasksCount: number;
  filesUploaded: number;
}

interface ClientStats {
  id: string;
  name: string;
  company: string | null;
  requestsCount: number;
  filesCount: number;
  isActive: boolean;
}

interface DailyActivity {
  date: string;
  files: number;
  requests: number;
  timeEntries: number;
}

interface MonthlyStats {
  month: string;
  clients: number;
  files: number;
  requests: number;
}

export function useReportsData() {
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([]);
  const [clientStats, setClientStats] = useState<ClientStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalFiles: 0,
    pendingApprovals: 0,
    totalTimeTracked: 0,
    totalRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeamStats = async () => {
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id, name, role, email")
      .eq("is_active", true);

    if (!teamMembers) return;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const statsPromises = teamMembers.map(async (member) => {
      // Get time entries for this month
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("duration_minutes")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const totalMinutes = timeEntries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

      // Get files uploaded by this team member
      const { count: filesCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .eq("uploaded_by", member.name)
        .gte("created_at", monthStart.toISOString());

      // Get posts created
      const { count: postsCount } = await supabase
        .from("scheduled_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString());

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        totalMinutes,
        tasksCount: postsCount || 0,
        filesUploaded: filesCount || 0,
      };
    });

    const stats = await Promise.all(statsPromises);
    setTeamStats(stats);
  };

  const fetchClientStats = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, is_active");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "client");

    if (!profiles || !roles) return;

    const clientIds = new Set(roles.map((r) => r.user_id));
    const clients = profiles.filter((p) => clientIds.has(p.id));

    const statsPromises = clients.map(async (client) => {
      const { count: requestsCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .eq("client_id", client.id);

      const { count: filesCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .eq("project_id", client.company_name || client.id);

      return {
        id: client.id,
        name: client.full_name || "Nieznany",
        company: client.company_name,
        requestsCount: requestsCount || 0,
        filesCount: filesCount || 0,
        isActive: client.is_active ?? true,
      };
    });

    const stats = await Promise.all(statsPromises);
    setClientStats(stats);
  };

  const fetchDailyActivity = async () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const activityPromises = days.map(async (day) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const { count: filesCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      const { count: requestsCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      const { count: timeEntriesCount } = await supabase
        .from("time_entries")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString());

      return {
        date: format(day, "EEE", { locale: pl }),
        files: filesCount || 0,
        requests: requestsCount || 0,
        timeEntries: timeEntriesCount || 0,
      };
    });

    const activity = await Promise.all(activityPromises);
    setDailyActivity(activity);
  };

  const fetchMonthlyStats = async () => {
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i));

    const statsPromises = months.map(async (month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const { count: clientsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const { count: filesCount } = await supabase
        .from("project_files")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      const { count: requestsCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      return {
        month: format(month, "MMM", { locale: pl }),
        clients: clientsCount || 0,
        files: filesCount || 0,
        requests: requestsCount || 0,
      };
    });

    const stats = await Promise.all(statsPromises);
    setMonthlyStats(stats);
  };

  const fetchSummaryStats = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "client");

    const clientIds = roles?.map((r) => r.user_id) || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, is_active")
      .in("id", clientIds.length > 0 ? clientIds : ["no-clients"]);

    const totalClients = profiles?.length || 0;
    const activeClients = profiles?.filter((p) => p.is_active).length || 0;

    const { count: totalFiles } = await supabase
      .from("project_files")
      .select("*", { count: "exact", head: true });

    const { count: pendingApprovals } = await supabase
      .from("project_files")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval");

    const { data: timeEntries } = await supabase
      .from("time_entries")
      .select("duration_minutes");

    const totalTimeTracked = timeEntries?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) || 0;

    const { count: totalRequests } = await supabase
      .from("client_requests")
      .select("*", { count: "exact", head: true });

    setSummaryStats({
      totalClients,
      activeClients,
      totalFiles: totalFiles || 0,
      pendingApprovals: pendingApprovals || 0,
      totalTimeTracked,
      totalRequests: totalRequests || 0,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchTeamStats(),
        fetchClientStats(),
        fetchDailyActivity(),
        fetchMonthlyStats(),
        fetchSummaryStats(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return {
    teamStats,
    clientStats,
    dailyActivity,
    monthlyStats,
    summaryStats,
    isLoading,
  };
}
