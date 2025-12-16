import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectMemberTime {
  userId: string;
  userName: string;
  email: string;
  totalMinutes: number;
  hourlyRate: number;
  currency: string;
  totalCost: number;
}

interface ProjectCostData {
  projectId: string;
  projectName: string;
  members: ProjectMemberTime[];
  totalMinutes: number;
  totalCost: number;
  currency: string;
}

export function useProjectCosts() {
  const { data: projectCosts = [], isLoading } = useQuery({
    queryKey: ["project-costs"],
    queryFn: async () => {
      // Get all time entries grouped by project
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("*")
        .not("project_id", "is", null);

      // Get all team member rates
      const { data: rates } = await supabase
        .from("team_member_rates")
        .select("*");

      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      if (!timeEntries || !rates || !profiles) return [];

      // Create rates map
      const ratesMap = new Map(rates.map((r) => [r.user_id, r]));
      const profilesMap = new Map(profiles.map((p) => [p.id, p]));

      // Group by project
      const projectsMap = new Map<string, Map<string, number>>();
      
      timeEntries.forEach((entry) => {
        if (!entry.project_id) return;
        
        if (!projectsMap.has(entry.project_id)) {
          projectsMap.set(entry.project_id, new Map());
        }
        
        const userTime = projectsMap.get(entry.project_id)!;
        const currentMinutes = userTime.get(entry.user_id) || 0;
        userTime.set(entry.user_id, currentMinutes + (entry.duration_minutes || 0));
      });

      // Build project costs data
      const projectCostsData: ProjectCostData[] = [];

      projectsMap.forEach((userTimes, projectId) => {
        const members: ProjectMemberTime[] = [];
        let projectTotalMinutes = 0;
        let projectTotalCost = 0;
        let projectCurrency = "PLN";

        userTimes.forEach((minutes, userId) => {
          const rate = ratesMap.get(userId);
          const profile = profilesMap.get(userId);
          const hourlyRate = rate?.hourly_rate || 0;
          const currency = rate?.currency || "PLN";
          const totalCost = (minutes / 60) * hourlyRate;

          projectTotalMinutes += minutes;
          projectTotalCost += totalCost;
          projectCurrency = currency;

          members.push({
            userId,
            userName: profile?.full_name || "Nieznany",
            email: profile?.email || "",
            totalMinutes: minutes,
            hourlyRate,
            currency,
            totalCost,
          });
        });

        projectCostsData.push({
          projectId,
          projectName: projectId,
          members: members.sort((a, b) => b.totalMinutes - a.totalMinutes),
          totalMinutes: projectTotalMinutes,
          totalCost: projectTotalCost,
          currency: projectCurrency,
        });
      });

      return projectCostsData.sort((a, b) => b.totalCost - a.totalCost);
    },
  });

  const exportToCSV = () => {
    if (projectCosts.length === 0) return;

    const headers = [
      "Projekt",
      "Członek zespołu",
      "Email",
      "Czas (minuty)",
      "Czas (godziny)",
      "Stawka/h",
      "Waluta",
      "Koszt",
    ];

    const rows: string[][] = [];

    projectCosts.forEach((project) => {
      project.members.forEach((member) => {
        rows.push([
          project.projectName,
          member.userName,
          member.email,
          member.totalMinutes.toString(),
          (member.totalMinutes / 60).toFixed(2),
          member.hourlyRate.toString(),
          member.currency,
          member.totalCost.toFixed(2),
        ]);
      });

      // Add project summary row
      rows.push([
        project.projectName,
        "RAZEM",
        "",
        project.totalMinutes.toString(),
        (project.totalMinutes / 60).toFixed(2),
        "",
        project.currency,
        project.totalCost.toFixed(2),
      ]);
      
      // Empty row between projects
      rows.push([]);
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `raport-kosztow-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return {
    projectCosts,
    isLoading,
    exportToCSV,
  };
}
