import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientRequest } from "@/hooks/useClientRequests";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface TaskCalendarProps {
  requests: ClientRequest[];
  onUpdateDeadline: (taskId: string, newDeadline: string) => void;
  onTaskClick?: (task: ClientRequest) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-500",
  normal: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const statusColors: Record<string, string> = {
  pending: "border-l-amber-500",
  in_progress: "border-l-blue-500",
  completed: "border-l-green-500",
  cancelled: "border-l-slate-400",
};

export function TaskCalendar({ requests, onUpdateDeadline, onTaskClick }: TaskCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const { teamMembers } = useTeamMembers();

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === "week") {
      const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad to start on Monday
    const startDay = monthStart.getDay();
    const paddingDays = startDay === 0 ? 6 : startDay - 1;
    const previousMonthDays = Array.from({ length: paddingDays }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (paddingDays - i));
      return date;
    });

    const allDays = [...previousMonthDays, ...daysInMonth];
    const remainingDays = 42 - allDays.length;
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i + 1);
      return date;
    });

    return [...allDays, ...nextMonthDays];
  }, [currentMonth, viewMode]);

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return requests.filter((task) => {
      if (!task.deadline) return false;
      return isSameDay(parseISO(task.deadline), day);
    });
  };

  // Calculate team workload
  const teamWorkload = useMemo(() => {
    const workload = new Map<string, { name: string; taskCount: number; urgentCount: number }>();
    
    requests.forEach((task) => {
      if (task.assigned_to && task.status !== "completed" && task.status !== "cancelled") {
        const member = task.assigned_member;
        const current = workload.get(task.assigned_to) || {
          name: member?.name || "Nieprzypisany",
          taskCount: 0,
          urgentCount: 0,
        };
        current.taskCount++;
        if (task.priority === "urgent" || task.priority === "high") {
          current.urgentCount++;
        }
        workload.set(task.assigned_to, current);
      }
    });

    return Array.from(workload.entries()).map(([id, data]) => ({
      id,
      ...data,
    })).sort((a, b) => b.taskCount - a.taskCount);
  }, [requests]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newDateStr = result.destination.droppableId;

    onUpdateDeadline(taskId, newDateStr);
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Niedz"];

  return (
    <div className="space-y-6">
      {/* Team Workload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Obciążenie zespołu
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamWorkload.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Brak przypisanych zadań
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamWorkload.map((member) => {
                const maxTasks = Math.max(...teamWorkload.map(m => m.taskCount), 1);
                const percentage = (member.taskCount / maxTasks) * 100;
                
                return (
                  <div key={member.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium truncate max-w-[100px]">
                          {member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {member.taskCount}
                        </Badge>
                        {member.urgentCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {member.urgentCount} pilne
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-2",
                        percentage > 80 && "[&>div]:bg-destructive"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">
              {format(currentMonth, viewMode === "week" ? "'Tydzień' w, LLLL yyyy" : "LLLL yyyy", { locale: pl })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "week" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Tydzień
                </Button>
                <Button
                  variant={viewMode === "month" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Miesiąc
                </Button>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(viewMode === "week" 
                    ? new Date(currentMonth.getTime() - 7 * 24 * 60 * 60 * 1000)
                    : subMonths(currentMonth, 1)
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Dziś
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(viewMode === "week"
                    ? new Date(currentMonth.getTime() + 7 * 24 * 60 * 60 * 1000)
                    : addMonths(currentMonth, 1)
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {dateRange.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const dateStr = format(day, "yyyy-MM-dd");

                return (
                  <Droppable key={dateStr} droppableId={dateStr}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "min-h-[120px] p-1 border rounded-md transition-colors",
                          isCurrentMonth ? "bg-background" : "bg-muted/30",
                          isToday && "ring-2 ring-primary",
                          snapshot.isDraggingOver && "bg-primary/10 border-primary"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-medium mb-1 flex items-center justify-between",
                            !isCurrentMonth && "text-muted-foreground",
                            isToday && "text-primary"
                          )}
                        >
                          <span>{format(day, "d")}</span>
                          {dayTasks.length > 0 && (
                            <Badge variant="outline" className="text-xs h-5 px-1">
                              {dayTasks.length}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.slice(0, viewMode === "week" ? 5 : 3).map((task, taskIndex) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={taskIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => onTaskClick?.(task)}
                                  className={cn(
                                    "p-1.5 rounded text-xs bg-card border-l-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
                                    statusColors[task.status],
                                    snapshot.isDragging && "shadow-lg ring-2 ring-primary"
                                  )}
                                >
                                  <div className="flex items-start gap-1">
                                    <span
                                      className={cn(
                                        "w-1.5 h-1.5 rounded-full shrink-0 mt-1",
                                        priorityColors[task.priority || "normal"]
                                      )}
                                    />
                                    <span className="line-clamp-2 font-medium">
                                      {task.title}
                                    </span>
                                  </div>
                                  {task.assigned_member && (
                                    <div className="mt-1 text-muted-foreground truncate">
                                      {task.assigned_member.name.split(" ")[0]}
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {dayTasks.length > (viewMode === "week" ? 5 : 3) && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayTasks.length - (viewMode === "week" ? 5 : 3)} więcej
                            </div>
                          )}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Niski
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Normalny
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Wysoki
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Pilny
            </div>
            <div className="border-l pl-4 flex items-center gap-1">
              <div className="w-3 h-3 border-l-2 border-l-amber-500" />
              Oczekujące
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-l-2 border-l-blue-500" />
              W trakcie
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-l-2 border-l-green-500" />
              Ukończone
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
