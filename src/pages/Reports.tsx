import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Users,
  Clock,
  FileText,
  TrendingUp,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { useReportsData } from "@/hooks/useReportsData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  generateTimeReport, 
  exportTimeReportToCSV, 
  exportTimeReportByProjectToCSV 
} from "@/utils/timeReportExport";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const formatMinutesToHours = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

const Reports = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const {
    teamStats,
    clientStats,
    dailyActivity,
    monthlyStats,
    summaryStats,
    isLoading,
  } = useReportsData();

  const handleExportDetailed = async () => {
    setIsExporting(true);
    try {
      const entries = await generateTimeReport();
      exportTimeReportToCSV(entries);
      toast({
        title: "Eksport zakończony",
        description: "Raport czasu pracy został pobrany",
      });
    } catch (error) {
      toast({
        title: "Błąd eksportu",
        description: "Nie udało się wygenerować raportu",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportByProject = async () => {
    setIsExporting(true);
    try {
      const entries = await generateTimeReport();
      exportTimeReportByProjectToCSV(entries);
      toast({
        title: "Eksport zakończony",
        description: "Raport kosztów projektów został pobrany",
      });
    } catch (error) {
      toast({
        title: "Błąd eksportu",
        description: "Nie udało się wygenerować raportu",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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

  const clientStatusData = [
    { name: "Aktywni", value: summaryStats.activeClients },
    { name: "Nieaktywni", value: summaryStats.totalClients - summaryStats.activeClients },
  ];

  const teamProductivityData = teamStats.map((member) => ({
    name: member.name.split(" ")[0],
    godziny: Math.round(member.totalMinutes / 60 * 10) / 10,
    pliki: member.filesUploaded,
  }));

  return (
    <DashboardLayout>
      <Helmet>
        <title>Raporty | FOTZ Studio</title>
        <meta name="description" content="Raporty i statystyki FOTZ Studio" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Raporty i Statystyki</h1>
              <p className="text-muted-foreground">Przegląd produktywności zespołu i aktywności klientów</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExportDetailed}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Eksport szczegółowy
            </Button>
            <Button 
              onClick={handleExportByProject}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Eksport projektów
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Klienci</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.activeClients} aktywnych
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pliki</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">
                {summaryStats.pendingApprovals} oczekuje na akceptację
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Czas pracy</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatMinutesToHours(summaryStats.totalTimeTracked)}
              </div>
              <p className="text-xs text-muted-foreground">łącznie zarejestrowane</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zgłoszenia</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">wszystkich zgłoszeń</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="team" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Zespół
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Klienci
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aktywność
            </TabsTrigger>
          </TabsList>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Produktywność zespołu</CardTitle>
                  <CardDescription>Godziny pracy i pliki w tym miesiącu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamProductivityData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="godziny" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Godziny" />
                        <Bar dataKey="pliki" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Pliki" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Szczegóły zespołu</CardTitle>
                  <CardDescription>Statystyki za bieżący miesiąc</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Członek</TableHead>
                        <TableHead>Rola</TableHead>
                        <TableHead className="text-right">Czas</TableHead>
                        <TableHead className="text-right">Pliki</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamStats.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Brak danych zespołu
                          </TableCell>
                        </TableRow>
                      ) : (
                        teamStats.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{member.role}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatMinutesToHours(member.totalMinutes)}
                            </TableCell>
                            <TableCell className="text-right">{member.filesUploaded}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Status klientów</CardTitle>
                  <CardDescription>Podział aktywnych i nieaktywnych</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {clientStatusData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lista klientów</CardTitle>
                  <CardDescription>Aktywność i zgłoszenia</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Klient</TableHead>
                          <TableHead>Firma</TableHead>
                          <TableHead className="text-right">Zgłoszenia</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientStats.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Brak klientów
                            </TableCell>
                          </TableRow>
                        ) : (
                          clientStats.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell className="font-medium">{client.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {client.company || "-"}
                              </TableCell>
                              <TableCell className="text-right">{client.requestsCount}</TableCell>
                              <TableCell className="text-center">
                                {client.isActive ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Aktywność tygodniowa</CardTitle>
                  <CardDescription>Pliki, zgłoszenia i wpisy czasu</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="files" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pliki" />
                        <Bar dataKey="requests" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Zgłoszenia" />
                        <Bar dataKey="timeEntries" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Wpisy czasu" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trend miesięczny</CardTitle>
                  <CardDescription>Ostatnie 6 miesięcy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="files"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                          name="Pliki"
                        />
                        <Line
                          type="monotone"
                          dataKey="requests"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-2))" }}
                          name="Zgłoszenia"
                        />
                        <Line
                          type="monotone"
                          dataKey="clients"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--chart-3))" }}
                          name="Nowi klienci"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
