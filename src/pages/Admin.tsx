import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Activity, Shield, Loader2 } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { UserManagement } from "@/components/admin/UserManagement";
import { ClientManagement } from "@/components/admin/ClientManagement";
import { ActivityLogs } from "@/components/admin/ActivityLogs";

const Admin = () => {
  const {
    users,
    activityLogs,
    teamMembers,
    isLoading,
    updateUserRole,
    toggleUserActive,
    assignTeamMember,
  } = useAdminData();

  const clients = users.filter((u) => u.role === "client");
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.is_active).length,
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.is_active).length,
  };

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
        <title>Panel Admina | FOTZ Studio</title>
        <meta name="description" content="Panel administracyjny FOTZ Studio - zarządzanie użytkownikami, klientami i logami aktywności." />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel Admina</h1>
            <p className="text-muted-foreground">Zarządzaj użytkownikami, klientami i monitoruj aktywność</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wszyscy użytkownicy</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} aktywnych</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Klienci</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">{stats.activeClients} aktywnych</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zespół</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">członków zespołu</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Logi aktywności</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activityLogs.length}</div>
              <p className="text-xs text-muted-foreground">ostatnich zdarzeń</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Klienci
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Zarządzanie użytkownikami</CardTitle>
                <CardDescription>
                  Przeglądaj użytkowników, zmieniaj role i zarządzaj dostępem do systemu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement
                  users={users}
                  onUpdateRole={updateUserRole}
                  onToggleActive={toggleUserActive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Zarządzanie klientami</CardTitle>
                <CardDescription>
                  Przeglądaj klientów, przypisuj opiekunów i archiwizuj nieaktywnych.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientManagement
                  clients={clients}
                  teamMembers={teamMembers}
                  onAssignTeamMember={assignTeamMember}
                  onToggleArchive={toggleUserActive}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logi aktywności</CardTitle>
                <CardDescription>
                  Monitoruj aktywność w systemie - logowania, zmiany ról, operacje na plikach.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityLogs logs={activityLogs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
