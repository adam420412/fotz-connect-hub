import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Timer,
  ListTodo,
  StickyNote,
  Play,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTimeTracking, formatDuration } from "@/hooks/useTimeTracking";
import { useClientRequests } from "@/hooks/useClientRequests";
import { useEmployeeNotes } from "@/hooks/useEmployeeNotes";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

const EmployeeDashboard = () => {
  const { profile } = useAuthContext();
  const { 
    runningEntry, 
    todayTotal, 
    weekTotal, 
    startTimer, 
    stopTimer, 
    isStarting, 
    isStopping 
  } = useTimeTracking();
  const { requests, isLoading: requestsLoading, updateRequest } = useClientRequests();
  const { notes, addNote, updateNote, deleteNote, isLoading: notesLoading } = useEmployeeNotes();

  const [timerDescription, setTimerDescription] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Timer effect
  useEffect(() => {
    if (!runningEntry) {
      setElapsedTime(0);
      return;
    }

    const start = new Date(runningEntry.start_time).getTime();
    const updateElapsed = () => {
      setElapsedTime(Math.floor((Date.now() - start) / 1000));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [runningEntry]);

  const formatElapsedTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    startTimer({ description: timerDescription || "Praca" });
  };

  const handleStopTimer = () => {
    if (runningEntry) {
      stopTimer(runningEntry.id);
      setTimerDescription("");
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNote(newNote.trim());
      setNewNote("");
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editingContent.trim()) {
      updateNote(id, editingContent.trim());
      setEditingNoteId(null);
      setEditingContent("");
    }
  };

  // Filter my tasks
  const myTasks = requests.filter((r) => 
    r.assigned_to && r.status !== "completed"
  ).sort((a, b) => {
    // Sort by deadline
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const urgentTasks = myTasks.filter((t) => 
    t.priority === "urgent" || t.priority === "high" || 
    (t.deadline && isPast(parseISO(t.deadline)))
  );

  const todayTasks = myTasks.filter((t) => 
    t.deadline && isToday(parseISO(t.deadline))
  );

  const getDeadlineLabel = (deadline: string | null) => {
    if (!deadline) return null;
    const date = parseISO(deadline);
    if (isPast(date) && !isToday(date)) return "Zaległe";
    if (isToday(date)) return "Dzisiaj";
    if (isTomorrow(date)) return "Jutro";
    return format(date, "d MMM", { locale: pl });
  };

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return "secondary";
    const date = parseISO(deadline);
    if (isPast(date) && !isToday(date)) return "destructive";
    if (isToday(date)) return "default";
    return "secondary";
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "normal": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const handleCompleteTask = (taskId: string) => {
    updateRequest({ id: taskId, status: "completed" });
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Mój Dashboard | FOTZ Studio</title>
        <meta name="description" content="Osobisty dashboard pracownika" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Witaj, {profile?.full_name?.split(" ")[0] || "Pracowniku"}!
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: pl })}
            </p>
          </div>
          {runningEntry && (
            <Badge variant="default" className="animate-pulse gap-2 text-sm px-4 py-2">
              <Timer className="h-4 w-4" />
              Timer aktywny: {formatElapsedTime(elapsedTime)}
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Moje zadania</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{urgentTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Pilne</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(todayTotal)}</p>
                  <p className="text-sm text-muted-foreground">Dzisiaj</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatDuration(weekTotal)}</p>
                  <p className="text-sm text-muted-foreground">Ten tydzień</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Timer Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-primary" />
                Timer
              </CardTitle>
              <CardDescription>Śledź swój czas pracy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={cn(
                  "text-4xl font-mono font-bold transition-colors",
                  runningEntry ? "text-primary" : "text-muted-foreground"
                )}>
                  {formatElapsedTime(elapsedTime)}
                </div>
                {runningEntry && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {runningEntry.description || "Praca w toku..."}
                  </p>
                )}
              </div>

              {!runningEntry ? (
                <>
                  <Input
                    placeholder="Nad czym pracujesz?"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                  />
                  <Button 
                    onClick={handleStartTimer} 
                    disabled={isStarting}
                    className="w-full gap-2"
                  >
                    {isStarting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleStopTimer} 
                  disabled={isStopping}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  {isStopping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Stop
                </Button>
              )}

              <Link to="/time-tracking">
                <Button variant="outline" className="w-full gap-2">
                  Historia czasu
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Moje zadania
                </CardTitle>
                <CardDescription>
                  {todayTasks.length > 0 
                    ? `${todayTasks.length} zadań na dziś` 
                    : "Brak zadań na dziś"}
                </CardDescription>
              </div>
              <Link to="/tasks">
                <Button variant="outline" size="sm" className="gap-1">
                  Wszystkie
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">Wszystkie ({myTasks.length})</TabsTrigger>
                  <TabsTrigger value="urgent">Pilne ({urgentTasks.length})</TabsTrigger>
                  <TabsTrigger value="today">Dzisiaj ({todayTasks.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <TaskList 
                    tasks={myTasks.slice(0, 6)} 
                    getDeadlineLabel={getDeadlineLabel}
                    getDeadlineColor={getDeadlineColor}
                    getPriorityColor={getPriorityColor}
                    onComplete={handleCompleteTask}
                  />
                </TabsContent>

                <TabsContent value="urgent">
                  <TaskList 
                    tasks={urgentTasks.slice(0, 6)} 
                    getDeadlineLabel={getDeadlineLabel}
                    getDeadlineColor={getDeadlineColor}
                    getPriorityColor={getPriorityColor}
                    onComplete={handleCompleteTask}
                  />
                </TabsContent>

                <TabsContent value="today">
                  <TaskList 
                    tasks={todayTasks.slice(0, 6)} 
                    getDeadlineLabel={getDeadlineLabel}
                    getDeadlineColor={getDeadlineColor}
                    getPriorityColor={getPriorityColor}
                    onComplete={handleCompleteTask}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              Moje notatki
            </CardTitle>
            <CardDescription>Osobiste notatki i przypomnienia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Dodaj nową notatkę..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[60px]"
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Notes list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {notesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Brak notatek. Dodaj pierwszą!
                  </p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="group rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                    >
                      {editingNoteId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveEdit(note.id)}
                              disabled={!editingContent.trim()}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Zapisz
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingNoteId(null);
                                setEditingContent("");
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Anuluj
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.created_at), "d MMM, HH:mm", { locale: pl })}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingContent(note.content);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteNote(note.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

// Task list component
interface TaskListProps {
  tasks: any[];
  getDeadlineLabel: (deadline: string | null) => string | null;
  getDeadlineColor: (deadline: string | null) => string;
  getPriorityColor: (priority: string | null) => string;
  onComplete: (taskId: string) => void;
}

const TaskList = ({ tasks, getDeadlineLabel, getDeadlineColor, getPriorityColor, onComplete }: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Brak zadań w tej kategorii
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={() => onComplete(task.id)}
          >
            <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-green-500" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {task.category?.name || task.request_type}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {task.priority && (
              <Badge variant={getPriorityColor(task.priority) as any}>
                {task.priority === "urgent" ? "Pilne" : 
                 task.priority === "high" ? "Wysoki" : 
                 task.priority === "normal" ? "Normalny" : "Niski"}
              </Badge>
            )}
            {getDeadlineLabel(task.deadline) && (
              <Badge variant={getDeadlineColor(task.deadline) as any}>
                {getDeadlineLabel(task.deadline)}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeDashboard;
