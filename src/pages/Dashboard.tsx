import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import TaskItem from "@/components/dashboard/TaskItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  Trophy,
  Inbox,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useClientRequests } from "@/hooks/useClientRequests";
import { useCRM } from "@/hooks/useCRM";
import { getNextStepStatus } from "@/components/crm/NextStepBadge";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useProjectFiles } from "@/hooks/useProjectFiles";

const STAGE_LABELS: Record<string, string> = {
  qualification: "Kwalifikacja",
  proposal: "Oferta",
  negotiation: "Negocjacje",
  won: "Wygrany",
  lost: "Przegrany",
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "Ręczne",
  "fotz.pl": "fotz.pl",
  referral: "Polecenie",
  social: "Social media",
  other: "Inne",
};

const PIE_COLORS = ["#103053", "#741443", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"];

const formatPLN = (v: number) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(v);

const Dashboard = () => {
  const { profile, isTeamMember } = useAuthContext();
  const { leads, deals } = useCRM();
  const { requests } = useClientRequests();
  const { files } = useProjectFiles();

  const displayName = isTeamMember
    ? profile?.full_name || "Zespół"
    : profile?.company_name || profile?.full_name || "Klient";

  // Client view stays as-is (files pending etc.)
  if (!isTeamMember) {
    const pendingFiles = files.filter((f) => f.status === "pending_approval");
    const pendingRequests = requests.filter(
      (r) => r.status === "pending" || r.status === "in_progress"
    );

    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-foreground">Panel klienta</h1>
            <p className="text-muted-foreground">
              Witaj, <span className="font-medium text-foreground">{displayName}</span>
            </p>
          </div>

          {pendingFiles.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Materiały do akceptacji
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Masz {pendingFiles.length}{" "}
                  {pendingFiles.length === 1 ? "plik" : "plików"} oczekujących na
                  akceptację
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

          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Twoje ostatnie zadania</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {pendingRequests.slice(0, 4).map((request) => (
                  <TaskItem
                    key={request.id}
                    id={request.id}
                    title={request.title}
                    status={request.status === "pending" ? "todo" : "in_progress"}
                    priority={
                      request.priority === "normal"
                        ? "medium"
                        : (request.priority as "low" | "high" | "urgent")
                    }
                    projectName={request.request_type}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Team / admin CRM dashboard
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const pipelineValue = deals
    .filter((d) => d.stage === "proposal" || d.stage === "negotiation")
    .reduce((s, d) => s + (d.value || 0), 0);

  const wonThisMonth = deals
    .filter((d) => {
      if (d.stage !== "won") return false;
      const t = new Date(d.updated_at);
      return t >= monthStart && t < monthEnd;
    })
    .reduce((s, d) => s + (d.value || 0), 0);

  const newLeadsCount = leads.filter((l) => l.status === "new").length;

  const overdueFollowUps =
    leads.filter((l) => getNextStepStatus(l.next_step_date) === "overdue").length +
    deals.filter((d) => getNextStepStatus(d.next_step_date) === "overdue").length;

  // Leads by source (pie)
  const sourceMap = new Map<string, number>();
  leads.forEach((l) => {
    sourceMap.set(l.source, (sourceMap.get(l.source) || 0) + 1);
  });
  const leadsBySource = Array.from(sourceMap.entries()).map(([k, v]) => ({
    name: SOURCE_LABELS[k] || k,
    value: v,
  }));

  // Deals by stage (bar with value sum)
  const dealsByStage = ["qualification", "proposal", "negotiation", "won", "lost"].map(
    (stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage: STAGE_LABELS[stage],
        count: stageDeals.length,
        value: stageDeals.reduce((s, d) => s + (d.value || 0), 0),
      };
    }
  );

  // Today list
  const todayLeads = leads
    .filter((l) => getNextStepStatus(l.next_step_date) === "today")
    .map((l) => ({
      id: l.id,
      kind: "lead" as const,
      title: l.name,
      subtitle: l.company || l.email,
      nextStep: l.next_step,
    }));

  const todayDeals = deals
    .filter((d) => getNextStepStatus(d.next_step_date) === "today")
    .map((d) => ({
      id: d.id,
      kind: "deal" as const,
      title: d.title,
      subtitle: d.lead?.company || d.lead?.name || formatPLN(d.value || 0),
      nextStep: d.next_step,
    }));

  const todoToday = [...todayLeads, ...todayDeals];

  const kpis = [
    {
      title: "Pipeline PLN",
      value: formatPLN(pipelineValue),
      icon: TrendingUp,
      description: "Oferta + Negocjacje",
    },
    {
      title: "Wygrane ten miesiąc",
      value: formatPLN(wonThisMonth),
      icon: Trophy,
      description: "Deale ze statusem Wygrany",
    },
    {
      title: "Nowe odpowiedzi do obsługi",
      value: newLeadsCount,
      icon: Inbox,
      description: "Leady ze statusem Nowy",
    },
    {
      title: "Zaległe follow-upy",
      value: overdueFollowUps,
      icon: AlertTriangle,
      description: "Leady + deale po terminie",
    },
  ];

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <div className="pb-2">
          <h1 className="text-2xl font-bold text-foreground">Panel zespołu</h1>
          <p className="text-muted-foreground">
            Witaj, <span className="font-medium text-foreground">{displayName}</span>
          </p>
        </div>

        {/* 4 KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatCard key={k.title} {...k} />
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leady wg źródła</CardTitle>
            </CardHeader>
            <CardContent>
              {leadsBySource.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Brak leadów do wyświetlenia
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={leadsBySource}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {leadsBySource.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deale wg etapu</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Brak deali do wyświetlenia
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={dealsByStage}>
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                      }
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "value" ? formatPLN(value) : value
                      }
                    />
                    <Legend
                      formatter={(v) => (v === "value" ? "Wartość PLN" : "Liczba")}
                    />
                    <Bar dataKey="value" fill="#103053" />
                    <Bar dataKey="count" fill="#741443" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Do zrobienia dzis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Do zrobienia dziś</CardTitle>
            <Badge variant="secondary">{todoToday.length}</Badge>
          </CardHeader>
          <CardContent>
            {todoToday.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
                <FileCheck className="h-5 w-5" />
                <span>Brak zaplanowanych follow-upów na dziś</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Kontekst</TableHead>
                    <TableHead>Następny krok</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todoToday.map((item) => (
                    <TableRow key={`${item.kind}-${item.id}`}>
                      <TableCell>
                        <Badge variant={item.kind === "lead" ? "outline" : "default"}>
                          {item.kind === "lead" ? "Lead" : "Deal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.subtitle}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.nextStep || "—"}
                      </TableCell>
                      <TableCell>
                        <Link to="/crm">
                          <Button variant="ghost" size="sm" className="gap-1">
                            Otwórz
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
