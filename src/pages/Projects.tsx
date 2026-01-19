import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Grid3X3, List, BarChart3, Users, Calendar, Trash2, Loader2, Clock, Eye } from "lucide-react";
import { ProjectMembersDialog } from "@/components/projects/ProjectMembersDialog";
import { ProjectCostReport } from "@/components/projects/ProjectCostReport";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { useProjects } from "@/hooks/useProjects";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { useProjectStats } from "@/hooks/useProjectStats";
import { useClients } from "@/hooks/useClients";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatDuration } from "@/hooks/useTimeTracking";

const statusConfig = {
  active: { label: "Aktywny", className: "bg-green-500/10 text-green-500" },
  paused: { label: "Wstrzymany", className: "bg-yellow-500/10 text-yellow-500" },
  completed: { label: "Zakończony", className: "bg-blue-500/10 text-blue-500" },
};

const Projects = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { projects, isLoading, createProject, updateProject, deleteProject, isCreating, isUpdating } = useProjects();
  const { isProjectMember } = useProjectMembers();
  const { getStatsForProject } = useProjectStats();
  const { data: clients = [] } = useClients();

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesClient = clientFilter === "all" || project.client_id === clientFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== "all") {
      const projectDate = new Date(project.created_at);
      const now = new Date();
      
      if (dateFilter === "today") {
        matchesDate = projectDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = projectDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = projectDate >= monthAgo;
      }
    }
    
    return matchesSearch && matchesStatus && matchesClient && matchesDate;
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || client?.full_name || client?.email;
  };

  return (
    <DashboardLayout title="Projekty">
      <Tabs defaultValue="projects" className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Projekty
            </TabsTrigger>
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Koszty
            </TabsTrigger>
          </TabsList>
          
          <ProjectDialog 
            onSave={createProject} 
            isLoading={isCreating} 
          />
        </div>

        <TabsContent value="projects" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Szukaj projektów..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="active">Aktywne</SelectItem>
                  <SelectItem value="paused">Wstrzymane</SelectItem>
                  <SelectItem value="completed">Zakończone</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Klient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy klienci</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name || client.full_name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cały czas</SelectItem>
                  <SelectItem value="today">Dzisiaj</SelectItem>
                  <SelectItem value="week">Ostatni tydzień</SelectItem>
                  <SelectItem value="month">Ostatni miesiąc</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                {projects.length === 0 ? "Brak projektów" : "Brak projektów spełniających kryteria"}
              </p>
              <p className="text-sm text-muted-foreground">
                {projects.length === 0 ? "Utwórz pierwszy projekt" : "Spróbuj zmienić filtry"}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {filteredProjects.map((project) => {
                const stats = getStatsForProject(project.id);
                const clientName = getClientName(project.client_id);
                
                return (
                  <Card key={project.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {project.description}
                          </p>
                        )}
                        {clientName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Klient: {clientName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <ProjectDialog
                          project={project}
                          onSave={updateProject}
                          isLoading={isUpdating}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Usuń projekt</AlertDialogTitle>
                              <AlertDialogDescription>
                                Czy na pewno chcesz usunąć projekt "{project.name}"? Ta akcja jest nieodwracalna.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Anuluj</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProject(project.id)}>
                                Usuń
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={statusConfig[project.status].className}>
                          {statusConfig[project.status].label}
                        </Badge>
                        {isProjectMember(project.id) && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Członek
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Postęp</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      {/* Project Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(stats?.totalTimeMinutes || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{stats?.memberCount || 0} członków</span>
                        </div>
                      </div>

                      {project.due_date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Termin: {format(new Date(project.due_date), "d MMM yyyy", { locale: pl })}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between pt-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Szczegóły
                        </Button>
                        <ProjectMembersDialog
                          projectId={project.id}
                          projectName={project.name}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="costs">
          <ProjectCostReport />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Projects;
