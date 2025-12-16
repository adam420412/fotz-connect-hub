import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Square,
  Clock,
  Calendar,
  TrendingUp,
  Trash2,
  Loader2,
  Circle,
  DollarSign,
} from "lucide-react";
import { useTimeTracking, formatDuration, TimeEntry } from "@/hooks/useTimeTracking";
import { useTeamMemberRates } from "@/hooks/useTeamMemberRates";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";

const TimeTracking = () => {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    entries,
    isLoading,
    runningEntry,
    startTimer,
    stopTimer,
    deleteEntry,
    isStarting,
    isStopping,
    todayTotal,
    weekTotal,
  } = useTimeTracking();

  const { myRate } = useTeamMemberRates();

  // Update elapsed time every second when timer is running
  useEffect(() => {
    if (!runningEntry) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const start = new Date(runningEntry.start_time).getTime();
      const now = Date.now();
      setElapsedTime(Math.floor((now - start) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningEntry]);

  const handleStart = () => {
    startTimer({ projectId: projectId || undefined, description: description || undefined });
    setDescription("");
    setProjectId("");
  };

  const handleStop = () => {
    if (runningEntry) {
      stopTimer(runningEntry.id);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Group entries by date
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = startOfDay(new Date(entry.start_time)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, TimeEntry[]>);

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Dzisiaj";
    if (isYesterday(date)) return "Wczoraj";
    return format(date, "EEEE, d MMMM", { locale: pl });
  };

  const getDayTotal = (entries: TimeEntry[]) => {
    return entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  };

  // Calculate earnings
  const calculateEarnings = (minutes: number) => {
    if (!myRate) return null;
    const hours = minutes / 60;
    return (hours * myRate.hourly_rate).toFixed(2);
  };

  const todayEarnings = calculateEarnings(todayTotal + Math.floor(elapsedTime / 60));
  const weekEarnings = calculateEarnings(weekTotal + Math.floor(elapsedTime / 60));

  return (
    <DashboardLayout title="Śledzenie Czasu">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Śledzenie Czasu</h1>
            <p className="text-muted-foreground">Monitoruj czas pracy nad projektami</p>
          </div>
          {runningEntry && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
              <Circle className="h-3 w-3 fill-destructive text-destructive animate-pulse" />
              <span className="text-sm font-medium text-destructive">Nagrywanie</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dzisiaj
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(todayTotal + Math.floor(elapsedTime / 60))}</p>
              {todayEarnings && (
                <p className="text-sm text-muted-foreground mt-1">
                  {todayEarnings} {myRate?.currency}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ten tydzień
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatDuration(weekTotal + Math.floor(elapsedTime / 60))}</p>
              {weekEarnings && (
                <p className="text-sm text-muted-foreground mt-1">
                  {weekEarnings} {myRate?.currency}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Średnia dzienna
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatDuration(Math.round(weekTotal / 7))}
              </p>
            </CardContent>
          </Card>
          {myRate && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Twoja stawka
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {myRate.hourly_rate} {myRate.currency}/h
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timer */}
        <Card className={runningEntry ? "border-destructive/50 bg-destructive/5 relative overflow-hidden" : ""}>
          {runningEntry && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive via-destructive/70 to-destructive animate-pulse" />
          )}
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Nad czym pracujesz?"
                value={runningEntry?.description || description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!!runningEntry}
                className="flex-1"
              />
              <Input
                placeholder="Projekt (opcjonalnie)"
                value={runningEntry?.project_id || projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!!runningEntry}
                className="sm:w-48"
              />
              <div className="flex items-center gap-3">
                {runningEntry && (
                  <Circle className="h-3 w-3 fill-destructive text-destructive animate-pulse" />
                )}
                <span className={`font-mono text-xl font-bold ${runningEntry ? "text-destructive" : "text-muted-foreground"}`}>
                  {formatElapsedTime(elapsedTime)}
                </span>
                {runningEntry ? (
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={handleStop}
                    disabled={isStopping}
                  >
                    {isStopping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="gradient" 
                    size="icon"
                    onClick={handleStart}
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Entries */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : Object.keys(groupedEntries).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak wpisów czasu. Rozpocznij śledzenie!</p>
            </div>
          ) : (
            Object.entries(groupedEntries)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayEntries]) => (
                <div key={date} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground capitalize">
                      {getDateLabel(date)}
                    </h3>
                    <Badge variant="secondary">
                      {formatDuration(getDayTotal(dayEntries))}
                    </Badge>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {dayEntries.map((entry, idx) => (
                      <div
                        key={entry.id}
                        className={`flex items-center gap-4 px-4 py-3 ${
                          idx !== dayEntries.length - 1 ? "border-b border-border" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {entry.description || "Bez opisu"}
                          </p>
                          {entry.project_id && (
                            <p className="text-sm text-muted-foreground">
                              {entry.project_id}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.start_time), "HH:mm")}
                          {entry.end_time && (
                            <> - {format(new Date(entry.end_time), "HH:mm")}</>
                          )}
                        </div>
                        <Badge variant={entry.is_running ? "default" : "secondary"}>
                          {entry.is_running 
                            ? formatElapsedTime(elapsedTime)
                            : formatDuration(entry.duration_minutes || 0)
                          }
                        </Badge>
                        {!entry.is_running && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimeTracking;
