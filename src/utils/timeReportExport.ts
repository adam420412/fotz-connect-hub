import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface TimeReportEntry {
  projectId: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number;
  description: string;
  hourlyRate: number;
  currency: string;
  cost: number;
}

export async function generateTimeReport(): Promise<TimeReportEntry[]> {
  // Get all time entries
  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*")
    .eq("is_running", false)
    .order("start_time", { ascending: false });

  // Get all profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email");

  // Get all rates
  const { data: rates } = await supabase
    .from("team_member_rates")
    .select("*");

  if (!timeEntries) return [];

  const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const ratesMap = new Map(rates?.map((r) => [r.user_id, r]) || []);

  return timeEntries.map((entry) => {
    const profile = profilesMap.get(entry.user_id);
    const rate = ratesMap.get(entry.user_id);
    const durationMinutes = entry.duration_minutes || 0;
    const hourlyRate = rate?.hourly_rate || 0;
    const currency = rate?.currency || "PLN";
    const cost = (durationMinutes / 60) * hourlyRate;

    return {
      projectId: entry.project_id || "Bez projektu",
      userName: profile?.full_name || "Nieznany",
      userEmail: profile?.email || "",
      startTime: entry.start_time,
      endTime: entry.end_time,
      durationMinutes,
      description: entry.description || "",
      hourlyRate,
      currency,
      cost,
    };
  });
}

export function exportTimeReportToCSV(entries: TimeReportEntry[]) {
  if (entries.length === 0) return;

  const headers = [
    "Projekt",
    "Członek zespołu",
    "Email",
    "Data rozpoczęcia",
    "Data zakończenia",
    "Czas (minuty)",
    "Czas (godziny)",
    "Opis",
    "Stawka/h",
    "Waluta",
    "Koszt",
  ];

  const rows = entries.map((entry) => [
    entry.projectId,
    entry.userName,
    entry.userEmail,
    format(new Date(entry.startTime), "yyyy-MM-dd HH:mm", { locale: pl }),
    entry.endTime ? format(new Date(entry.endTime), "yyyy-MM-dd HH:mm", { locale: pl }) : "",
    entry.durationMinutes.toString(),
    (entry.durationMinutes / 60).toFixed(2),
    entry.description,
    entry.hourlyRate.toString(),
    entry.currency,
    entry.cost.toFixed(2),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `raport-czasu-pracy-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

export function exportTimeReportByProjectToCSV(entries: TimeReportEntry[]) {
  if (entries.length === 0) return;

  // Group by project
  const projectMap = new Map<string, TimeReportEntry[]>();
  entries.forEach((entry) => {
    if (!projectMap.has(entry.projectId)) {
      projectMap.set(entry.projectId, []);
    }
    projectMap.get(entry.projectId)!.push(entry);
  });

  const headers = [
    "Projekt",
    "Członek zespołu",
    "Email",
    "Łączny czas (minuty)",
    "Łączny czas (godziny)",
    "Stawka/h",
    "Waluta",
    "Łączny koszt",
  ];

  const rows: string[][] = [];

  projectMap.forEach((projectEntries, projectId) => {
    // Group by user within project
    const userMap = new Map<string, { minutes: number; rate: number; currency: string; email: string }>();
    
    projectEntries.forEach((entry) => {
      const key = entry.userName;
      if (!userMap.has(key)) {
        userMap.set(key, {
          minutes: 0,
          rate: entry.hourlyRate,
          currency: entry.currency,
          email: entry.userEmail,
        });
      }
      const userData = userMap.get(key)!;
      userData.minutes += entry.durationMinutes;
    });

    let projectTotalMinutes = 0;
    let projectTotalCost = 0;

    userMap.forEach((userData, userName) => {
      const cost = (userData.minutes / 60) * userData.rate;
      projectTotalMinutes += userData.minutes;
      projectTotalCost += cost;

      rows.push([
        projectId,
        userName,
        userData.email,
        userData.minutes.toString(),
        (userData.minutes / 60).toFixed(2),
        userData.rate.toString(),
        userData.currency,
        cost.toFixed(2),
      ]);
    });

    // Project summary row
    rows.push([
      projectId,
      "RAZEM",
      "",
      projectTotalMinutes.toString(),
      (projectTotalMinutes / 60).toFixed(2),
      "",
      projectEntries[0]?.currency || "PLN",
      projectTotalCost.toFixed(2),
    ]);

    rows.push([]); // Empty row between projects
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `raport-czasu-projekty-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}
