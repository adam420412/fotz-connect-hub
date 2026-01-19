import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  FileCheck,
  Clock,
  MessageSquare,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Loader2,
  Send,
  History,
  FileText,
  Star,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClientRequests, ClientRequest } from "@/hooks/useClientRequests";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { format, formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ClientPortal = () => {
  const { profile } = useAuthContext();
  const { requests, stats, isLoading: requestsLoading, createRequest, isCreating } = useClientRequests();
  const { files } = useProjectFiles();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  
  const [feedbackContent, setFeedbackContent] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Filter files for current client
  const pendingFiles = files.filter((f) => f.status === "pending_approval");
  const approvedFiles = files.filter((f) => f.status === "approved");
  const recentFiles = files.slice(0, 5);

  // Client's requests
  const myRequests = requests.filter((r) => r.client_id === profile?.id);
  const activeProjects = myRequests.filter((r) => r.status === "in_progress" || r.status === "pending");
  const completedProjects = myRequests.filter((r) => r.status === "completed");
  const recentActivity = myRequests.slice(0, 10);

  // Calculate project progress
  const projectProgress = myRequests.length > 0 
    ? (completedProjects.length / myRequests.length) * 100 
    : 0;

  const handleSubmitFeedback = () => {
    if (feedbackContent.trim()) {
      createRequest({
        title: `Feedback: ${feedbackContent.slice(0, 50)}...`,
        description: feedbackContent,
        request_type: "feedback",
        priority: "normal",
      });
      setFeedbackContent("");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Oczekuje</Badge>;
      case "in_progress":
        return <Badge variant="default">W realizacji</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Ukończone</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Anulowane</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFileStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge variant="secondary">Do akceptacji</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Zaakceptowane</Badge>;
      case "rejected":
        return <Badge variant="destructive">Odrzucone</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = requestsLoading || statsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Portal Klienta | FOTZ Studio</title>
        <meta name="description" content="Portal klienta - status projektów i komunikacja" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Witaj, {profile?.full_name || profile?.company_name || "Kliencie"}!
            </h1>
            <p className="text-muted-foreground">
              Śledź postępy swoich projektów i komunikuj się z zespołem
            </p>
          </div>
          <Link to="/new-request">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nowe zlecenie
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProjects.length}</p>
                  <p className="text-sm text-muted-foreground">Aktywne projekty</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <FileCheck className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingFiles.length}</p>
                  <p className="text-sm text-muted-foreground">Do akceptacji</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedProjects.length}</p>
                  <p className="text-sm text-muted-foreground">Ukończone</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedFiles.length}</p>
                  <p className="text-sm text-muted-foreground">Zaakceptowane pliki</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert for pending approvals */}
        {pendingFiles.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Materiały oczekują na akceptację</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingFiles.length} {pendingFiles.length === 1 ? "plik" : "plików"} czeka na Twoją opinię
                  </p>
                </div>
              </div>
              <Link to="/approval-center">
                <Button variant="gradient" className="gap-2">
                  Przejdź do akceptacji
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="overview" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Przegląd
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Clock className="h-4 w-4" />
              Projekty
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historia
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Project Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Postęp współpracy
                  </CardTitle>
                  <CardDescription>Ogólny status Twoich projektów</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Ukończone projekty</span>
                    <span className="font-medium">{Math.round(projectProgress)}%</span>
                  </div>
                  <Progress value={projectProgress} className="h-3" />
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                      <p className="text-xs text-muted-foreground">Oczekujące</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{stats.in_progress}</p>
                      <p className="text-xs text-muted-foreground">W realizacji</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">Ukończone</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Files */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Ostatnie pliki
                    </CardTitle>
                    <CardDescription>Najnowsze materiały do projektu</CardDescription>
                  </div>
                  <Link to="/files">
                    <Button variant="outline" size="sm" className="gap-1">
                      Wszystkie
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentFiles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Brak plików
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(file.created_at), { 
                                addSuffix: true, 
                                locale: pl 
                              })}
                            </p>
                          </div>
                          {getFileStatusBadge(file.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Ostatnia aktywność
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Brak aktywności
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{request.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), "d MMM, HH:mm", { locale: pl })}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Twoje projekty</CardTitle>
                <CardDescription>Status wszystkich Twoich zleceń</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {activeProjects.length === 0 && completedProjects.length === 0 ? (
                    <div className="text-center py-12">
                      <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Brak projektów</p>
                      <Link to="/new-request">
                        <Button className="mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          Złóż pierwsze zlecenie
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Active Projects */}
                      {activeProjects.length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Aktywne ({activeProjects.length})
                          </h3>
                          {activeProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} getStatusBadge={getStatusBadge} />
                          ))}
                        </>
                      )}

                      {/* Completed Projects */}
                      {completedProjects.length > 0 && (
                        <>
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">
                            Ukończone ({completedProjects.length})
                          </h3>
                          {completedProjects.slice(0, 5).map((project) => (
                            <ProjectCard key={project.id} project={project} getStatusBadge={getStatusBadge} />
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historia zamówień</CardTitle>
                <CardDescription>Pełna historia Twoich zleceń</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {myRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      Brak historii zamówień
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {myRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            request.status === "completed" && "bg-green-500",
                            request.status === "in_progress" && "bg-primary",
                            request.status === "pending" && "bg-amber-500",
                            request.status === "cancelled" && "bg-destructive"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{request.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(request.created_at), "d MMMM yyyy", { locale: pl })}</span>
                              <span>•</span>
                              <span className="capitalize">{request.request_type}</span>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                          {request.deadline && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.deadline), "d MMM", { locale: pl })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Prześlij feedback
                </CardTitle>
                <CardDescription>
                  Podziel się swoją opinią, sugestiami lub zgłoś problem
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Napisz swoją opinię, sugestię lub zgłoś problem..."
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitFeedback} 
                    disabled={!feedbackContent.trim() || isCreating}
                    className="gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Wyślij feedback
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Twoje wcześniejsze zgłoszenia</CardTitle>
              </CardHeader>
              <CardContent>
                {myRequests.filter((r) => r.request_type === "feedback").length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Brak wcześniejszych zgłoszeń feedback
                  </p>
                ) : (
                  <div className="space-y-3">
                    {myRequests
                      .filter((r) => r.request_type === "feedback")
                      .slice(0, 5)
                      .map((feedback) => (
                        <div
                          key={feedback.id}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(feedback.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                            </span>
                            {getStatusBadge(feedback.status)}
                          </div>
                          <p className="text-sm">{feedback.description}</p>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: ClientRequest;
  getStatusBadge: (status: string) => JSX.Element;
}

const ProjectCard = ({ project, getStatusBadge }: ProjectCardProps) => {
  return (
    <div className="rounded-lg border p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{project.title}</h4>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(project.created_at), { addSuffix: true, locale: pl })}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Termin: {format(new Date(project.deadline), "d MMM", { locale: pl })}
              </span>
            )}
            {project.assigned_member && (
              <span>Opiekun: {project.assigned_member.name}</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {getStatusBadge(project.status)}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
