import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckSquare,
  DollarSign,
  Calendar,
  Activity,
  FileText,
  Loader2,
  ListTodo,
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useProjectStats } from "@/hooks/useProjectStats";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useProjectActivity } from "@/hooks/useProjectActivity";
import { useClients } from "@/hooks/useClients";
import { ProjectMembersDialog } from "@/components/projects/ProjectMembersDialog";
import { ProjectPDFExport } from "@/components/projects/ProjectPDFExport";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatDuration } from "@/hooks/useTimeTracking";

const statusConfig = {
  active: { label: "Aktywny", className: "bg-green-500/10 text-green-500" },
  paused: { label: "Wstrzymany", className: "bg-yellow-500/10 text-yellow-500" },
  completed: { label: "Zakończony", className: "bg-blue-500/10 text-blue-500" },
};

const priorityConfig = {
  low: { label: "Niski", className: "bg-gray-500/10 text-gray-500" },
  normal: { label: "Normalny", className: "bg-blue-500/10 text-blue-500" },
  high: { label: "Wysoki", className: "bg-orange-500/10 text-orange-500" },
  urgent: { label: "Pilny", className: "bg-red-500/10 text-red-500" },
};

const taskStatusConfig = {
  pending: { label: "Oczekujące", className: "bg-yellow-500/10 text-yellow-500" },
  in_progress: { label: "W trakcie", className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Zakończone", className: "bg-green-500/10 text-green-500" },
  cancelled: { label: "Anulowane", className: "bg-gray-500/10 text-gray-500" },
};

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { projects, isLoading: projectsLoading } = useProjects();
  const { stats } = useProjectStats(id);
  const { members: projectMembers } = useProjectMembers(id);
  const { tasks, isLoading: tasksLoading } = useProjectTasks(id);
  const { activities, isLoading: activitiesLoading } = useProjectActivity(id);
  const { data: clients = [] } = useClients();

  const project = projects.find((p) => p.id === id);

  if (projectsLoading) {
    return (
      <DashboardLayout title="Szczegóły projektu">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Projekt nie znaleziony">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-lg font-medium text-muted-foreground mb-4">
            Nie znaleziono projektu
          </p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć do projektów
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const client = clients.find((c) => c.id === project.client_id);
  const clientName = client?.company_name || client?.full_name || client?.email;

  // Calculate task stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  // Calculate estimated cost (simplified - would need hourly rates)
  const estimatedHours = (stats?.totalTimeMinutes || 0) / 60;

  return (
    <DashboardLayout title={project.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              {clientName && (
                <p className="text-sm text-muted-foreground">Klient: {clientName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProjectMembersDialog projectId={project.id} projectName={project.name} />
            <ProjectPDFExport project={project} stats={stats} tasks={tasks} />
          </div>
        </div>

        {/* Status and Progress */}
        <div className="flex flex-wrap items-center gap-4">
          <Badge className={statusConfig[project.status].className}>
            {statusConfig[project.status].label}
          </Badge>
          {project.due_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Termin: {format(new Date(project.due_date), "d MMMM yyyy", { locale: pl })}
            </div>
          )}
        </div>

        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Postęp projektu</span>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-3" />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Czas pracy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(stats?.totalTimeMinutes || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {estimatedHours.toFixed(1)} godzin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zadania</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {taskStats.completed}/{taskStats.total}
              </p>
              <p className="text-xs text-muted-foreground">
                {taskStats.in_progress} w trakcie
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Członkowie</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.memberCount || 0}</p>
              <p className="text-xs text-muted-foreground">przypisanych</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktywność</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted-foreground">zdarzeń</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Tasks and Activity */}
        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Zadania ({taskStats.total})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Aktywność
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Brak zadań w projekcie</p>
                  <p className="text-sm text-muted-foreground">
                    Przypisz zadania do tego projektu
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tytuł</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priorytet</TableHead>
                      <TableHead>Przypisany</TableHead>
                      <TableHead>Termin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          <Link 
                            to="/tasks" 
                            className="hover:underline text-primary"
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={taskStatusConfig[task.status]?.className}>
                            {taskStatusConfig[task.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityConfig[task.priority]?.className}>
                            {priorityConfig[task.priority]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {task.assigned_member?.name || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {task.deadline
                            ? format(new Date(task.deadline), "d MMM yyyy", { locale: pl })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Brak aktywności</p>
                  <p className="text-sm text-muted-foreground">
                    Historia działań pojawi się tutaj
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 pb-4 border-b last:border-0"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{activity.user_email || "System"}</span>
                            {" "}
                            <span className="text-muted-foreground">{activity.action_type}</span>
                            {activity.entity_name && (
                              <span className="font-medium"> "{activity.entity_name}"</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(activity.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetails;