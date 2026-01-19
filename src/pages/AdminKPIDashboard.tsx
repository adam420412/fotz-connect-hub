import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Loader2,
  Percent,
  Timer,
  Award,
} from "lucide-react";
import { useAdminKPI } from "@/hooks/useAdminKPI";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
};

const AdminKPIDashboard = () => {
  const { data: kpi, isLoading } = useAdminKPI();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!kpi) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Błąd ładowania danych</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Helmet>
        <title>Dashboard KPI | FOTZ Studio</title>
        <meta name="description" content="Dashboard analityczny z kluczowymi wskaźnikami" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard KPI</h1>
            <p className="text-muted-foreground">Kluczowe wskaźniki efektywności</p>
          </div>
        </div>

        {/* Revenue KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Przychód całkowity</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpi.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Ze wszystkich wygranych dealów
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Przychód miesięczny</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpi.monthlyRevenue)}</div>
              <div className={cn(
                "flex items-center gap-1 text-xs",
                kpi.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {kpi.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {kpi.revenueGrowth >= 0 ? "+" : ""}{kpi.revenueGrowth.toFixed(1)}% vs poprzedni miesiąc
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Średnia wartość deala</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpi.avgDealValue)}</div>
              <p className="text-xs text-muted-foreground">
                Na podstawie wygranych dealów
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wykorzystanie zespołu</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.teamUtilization}%</div>
              <Progress value={kpi.teamUtilization} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Lead Conversion & Project Completion */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Konwersja leadów</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {kpi.convertedLeads} z {kpi.totalLeads} leadów
              </p>
              <Progress value={kpi.conversionRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Śr. czas realizacji</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.avgCompletionDays} dni</div>
              <p className="text-xs text-muted-foreground">
                Od utworzenia do zakończenia
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Terminowość</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.onTimeRate}%</div>
              <p className="text-xs text-muted-foreground">
                Projektów na czas
              </p>
              <Progress 
                value={kpi.onTimeRate} 
                className={cn("mt-2", kpi.onTimeRate < 70 && "[&>div]:bg-amber-500")} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Zaległe projekty</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                kpi.overdueProjects > 0 && "text-destructive"
              )}>
                {kpi.overdueProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                Po terminie realizacji
              </p>
              {kpi.overdueProjects > 0 && (
                <Badge variant="destructive" className="mt-2">
                  Wymaga uwagi
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Trend przychodów</CardTitle>
              <CardDescription>Przychody w ostatnich 6 miesiącach</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpi.monthlyTrends}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Przychód"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads by Source */}
          <Card>
            <CardHeader>
              <CardTitle>Leady wg źródła</CardTitle>
              <CardDescription>Skąd przychodzą nowi klienci</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kpi.leadsBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="source"
                      label={({ source, count }) => `${source}: ${count}`}
                    >
                      {kpi.leadsBySource.map((_, index) => (
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
        </div>

        {/* Activity Trends & Top Performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aktywność miesięczna</CardTitle>
              <CardDescription>Leady i ukończone projekty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpi.monthlyTrends}>
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
                    <Bar dataKey="leads" name="Leady" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedProjects" name="Ukończone" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performerzy
              </CardTitle>
              <CardDescription>Najlepsi członkowie zespołu w tym miesiącu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpi.topPerformers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Brak danych o wydajności
                  </p>
                ) : (
                  kpi.topPerformers.map((performer, index) => (
                    <div
                      key={performer.name}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        index === 0 && "bg-amber-500/20 text-amber-500",
                        index === 1 && "bg-slate-400/20 text-slate-500",
                        index === 2 && "bg-amber-700/20 text-amber-700",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{performer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {performer.tasks} zadań • {performer.hours}h pracy
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {performer.tasks} zadań
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Podsumowanie miesiąca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-primary">{kpi.completedThisMonth}</p>
                <p className="text-sm text-muted-foreground">Ukończonych projektów</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-green-500">{formatCurrency(kpi.monthlyRevenue)}</p>
                <p className="text-sm text-muted-foreground">Przychód</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{kpi.totalLeads}</p>
                <p className="text-sm text-muted-foreground">Nowych leadów</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{kpi.teamUtilization}%</p>
                <p className="text-sm text-muted-foreground">Wykorzystanie zespołu</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminKPIDashboard;
