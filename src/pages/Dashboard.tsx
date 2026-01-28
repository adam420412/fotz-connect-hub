import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import TaskItem from "@/components/dashboard/TaskItem";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  FileCheck,
  ArrowRight,
  Timer,
  FileBox,
  AlertCircle,
  Loader2,
  ListTodo,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTimeTracking, formatDuration } from "@/hooks/useTimeTracking";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { useClientRequests } from "@/hooks/useClientRequests";
import { useProjects } from "@/hooks/useProjects";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const Dashboard = () => {
  const { profile, isTeamMember } = useAuthContext();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { runningEntry, todayTotal } = useTimeTracking();
  const { files } = useProjectFiles();
  const { requests, stats: requestStats } = useClientRequests();
  const { projects, isLoading: projectsLoading } = useProjects();

  // Transform projects to ProjectCard format
  const activeProjects = projects
    .filter(p => p.status === "active")
    .slice(0, 4)
    .map(project => ({
      id: project.id,
      name: project.name,
      description: project.description || "",
      progress: project.progress || 0,
      tasksCompleted: Math.round((project.progress || 0) / 10),
      totalTasks: 10,
      dueDate: project.due_date ? format(new Date(project.due_date), "d MMM", { locale: pl }) : undefined,
      status: project.status as "active" | "paused" | "completed",
      team: [] as { name: string }[],
    }));

  // Generate recent activities from requests
  const activities = requests.slice(0, 3).map((req, idx) => ({
    id: req.id,
    type: idx === 0 ? "comment" as const : idx === 1 ? "file_approved" as const : "task_completed" as const,
    title: req.status === "completed" ? "Zadanie ukończone" : req.status === "in_progress" ? "Zadanie w realizacji" : "Nowe zadanie",
    description: req.title,
    time: format(new Date(req.updated_at), "d MMM, HH:mm", { locale: pl }),
    user: { name: req.assigned_member?.name || "System" },
  }));

  const displayName = isTeamMember 
    ? profile?.full_name || "Zespół"
    : profile?.company_name || profile?.full_name || "Klient";

  // Get pending files for client
  const pendingFiles = files.filter(f => f.status === "pending_approval");
  
  // Get user's pending requests
  const pendingRequests = requests.filter(r => r.status === "pending" || r.status === "in_progress");

  // Dynamic stats based on real data
  const dynamicStats = isTeamMember ? [
    {
      title: "Oczekujące",
      value: requestStats.pending,
      icon: Clock,
      description: "Zadania do podjęcia",
    },
    {
      title: "W realizacji",
      value: requestStats.in_progress,
      icon: FolderKanban,
      description: "Aktywne zadania",
    },
    {
      title: "Ukończone",
      value: requestStats.completed,
      icon: CheckSquare,
      description: "Zakończone zadania",
    },
    {
      title: "Czas dzisiaj",
      value: formatDuration(todayTotal),
      icon: Timer,
      description: runningEntry ? "Timer aktywny" : undefined,
    },
  ] : [
    {
      title: "Aktywne projekty",
      value: stats?.activeRequests || 0,
      icon: FolderKanban,
    },
    {
      title: "Do akceptacji",
      value: stats?.pendingApprovalFiles || 0,
      icon: FileCheck,
      description: "Pliki oczekujące",
    },
    {
      title: "Zadania w toku",
      value: pendingRequests.length,
      icon: CheckSquare,
    },
    {
      title: "Ukończone",
      value: stats?.completedTasksThisWeek || 0,
      icon: CheckSquare,
      description: "W tym tygodniu",
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="pb-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isTeamMember ? "Panel zespołu" : "Panel klienta"}
          </h1>
          <p className="text-muted-foreground">
            Witaj, <span className="font-medium text-foreground">{displayName}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dynamicStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Quick Actions for Clients */}
        {!isTeamMember && pendingFiles.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-primary" />
                Materiały do akceptacji
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Masz {pendingFiles.length} {pendingFiles.length === 1 ? "plik" : "plików"} oczekujących na akceptację
              </p>
              <Link to="/approval-center">
                <Button variant="gradient" className="gap-2">
                  Przejdź do centrum akceptacji
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Team Time Tracking Widget */}
        {isTeamMember && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Timer className="h-5 w-5 text-primary" />
                Śledzenie czasu
              </CardTitle>
              <Link to="/time-tracking">
                <Button variant="outline" size="sm" className="gap-1">
                  Zobacz więcej
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {runningEntry ? (
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="animate-pulse">
                    Timer aktywny
                  </Badge>
                  <span className="text-muted-foreground">
                    {runningEntry.description || "Praca w toku..."}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Brak aktywnego timera. Dzisiaj: {formatDuration(todayTotal)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Aktywne projekty</h2>
              <Link
                to="/projects"
                className="text-sm text-primary hover:underline"
              >
                Zobacz wszystkie
              </Link>
            </div>
            {projectsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-48 rounded-lg bg-muted animate-pulse" />
                <div className="h-48 rounded-lg bg-muted animate-pulse" />
              </div>
            ) : activeProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeProjects.slice(0, 2).map((project) => (
                  <ProjectCard key={project.id} {...project} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">Brak aktywnych projektów</p>
                <Link to="/projects" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Utwórz pierwszy projekt
                </Link>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <RecentActivity activities={activities.length > 0 ? activities : [
              { id: "empty", type: "task_completed" as const, title: "Brak aktywności", description: "Zacznij pracę nad zadaniami", time: "teraz", user: { name: "System" } }
            ]} />
          </div>
        </div>

        {/* Recent Client Requests for Clients */}
        {!isTeamMember && pendingRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Twoje ostatnie zadania</h2>
              <Link to="/tasks" className="text-sm text-primary hover:underline">
                Zobacz wszystkie
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {pendingRequests.slice(0, 4).map((request) => (
                <TaskItem 
                  key={request.id}
                  id={request.id}
                  title={request.title}
                  status={request.status === "pending" ? "todo" : "in_progress"}
                  priority={request.priority === "normal" ? "medium" : request.priority as "low" | "high" | "urgent"}
                  projectName={request.request_type}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
