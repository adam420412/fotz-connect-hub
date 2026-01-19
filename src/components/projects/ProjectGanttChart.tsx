import { useMemo, useState } from "react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend } from "date-fns";
import { pl } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Link2 } from "lucide-react";

export interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  assignee?: string;
  assigneeId?: string;
  projectName?: string;
  dependsOn?: string[]; // IDs of tasks this task depends on
}

interface ProjectGanttChartProps {
  tasks: GanttTask[];
  startDate?: Date;
  endDate?: Date;
  teamMembers?: { id: string; name: string }[];
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-slate-400",
};

const statusColors: Record<string, string> = {
  pending: "opacity-60",
  in_progress: "opacity-100",
  completed: "opacity-40",
  cancelled: "opacity-30",
};

export function ProjectGanttChart({ tasks, startDate, endDate, teamMembers = [] }: ProjectGanttChartProps) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const { days, chartStart } = useMemo(() => {
    const now = new Date();
    const start = startDate || startOfMonth(now);
    const end = endDate || endOfMonth(addDays(now, 60));
    
    return {
      days: eachDayOfInterval({ start, end }),
      chartStart: start,
      chartEnd: end,
    };
  }, [startDate, endDate]);

  // Get unique assignees from tasks
  const uniqueAssignees = useMemo(() => {
    const assignees = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.assignee && task.assigneeId) {
        assignees.set(task.assigneeId, task.assignee);
      }
    });
    return Array.from(assignees.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  // Filter tasks by assignee
  const filteredTasks = useMemo(() => {
    if (assigneeFilter === "all") return tasks;
    if (assigneeFilter === "unassigned") return tasks.filter((t) => !t.assigneeId);
    return tasks.filter((t) => t.assigneeId === assigneeFilter);
  }, [tasks, assigneeFilter]);

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.max(0, differenceInDays(task.startDate, chartStart));
    const duration = Math.max(1, differenceInDays(task.endDate, task.startDate) + 1);
    const totalDays = days.length;
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
      startOffset,
      duration,
    };
  };

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [filteredTasks]);

  // Create a map of task positions for drawing dependency lines
  const taskPositions = useMemo(() => {
    const positions = new Map<string, { rowIndex: number; left: number; width: number }>();
    sortedTasks.forEach((task, index) => {
      const pos = getTaskPosition(task);
      positions.set(task.id, { rowIndex: index, left: pos.left, width: pos.width });
    });
    return positions;
  }, [sortedTasks, days.length, chartStart]);

  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    const lines: Array<{
      fromTask: string;
      toTask: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    sortedTasks.forEach((task) => {
      if (task.dependsOn && task.dependsOn.length > 0) {
        const toPos = taskPositions.get(task.id);
        if (!toPos) return;

        task.dependsOn.forEach((depId) => {
          const fromPos = taskPositions.get(depId);
          if (!fromPos) return;

          lines.push({
            fromTask: depId,
            toTask: task.id,
            x1: fromPos.left + fromPos.width,
            y1: fromPos.rowIndex,
            x2: toPos.left,
            y2: toPos.rowIndex,
          });
        });
      }
    });

    return lines;
  }, [sortedTasks, taskPositions]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Brak zadań z datami do wyświetlenia
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtruj po osobie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy</SelectItem>
                <SelectItem value="unassigned">Nieprzypisane</SelectItem>
                {uniqueAssignees.map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 ml-auto text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Pilne</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>Wysoki</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Normalny</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-400" />
              <span>Niski</span>
            </div>
            <div className="flex items-center gap-1 border-l pl-4">
              <Link2 className="h-3 w-3" />
              <span>Zależność</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <ScrollArea className="w-full">
            <div className="min-w-[1200px]">
              {/* Header with dates */}
              <div className="sticky top-0 z-10 bg-card border-b">
                <div className="flex">
                  <div className="w-72 shrink-0 px-4 py-2 font-medium border-r bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span>Zadanie</span>
                      <Badge variant="secondary" className="text-xs">
                        {filteredTasks.length}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 flex">
                    {days.map((day, idx) => {
                      const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                      const isFirstOfMonth = day.getDate() === 1;
                      
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex-1 min-w-[24px] text-center text-xs py-1 border-r last:border-r-0",
                            isWeekend(day) && "bg-muted/30",
                            isToday && "bg-primary/10 font-bold",
                            isFirstOfMonth && "border-l-2 border-l-primary/50"
                          )}
                        >
                          {isFirstOfMonth && (
                            <div className="text-[10px] text-muted-foreground font-medium">
                              {format(day, "MMM", { locale: pl })}
                            </div>
                          )}
                          <div className={cn(
                            isToday && "text-primary",
                            !isSameMonth(day, new Date()) && "text-muted-foreground/50"
                          )}>
                            {format(day, "d")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Task rows with dependency lines */}
              <div className="relative">
                {/* SVG overlay for dependency lines */}
                <svg
                  className="absolute inset-0 pointer-events-none z-[5]"
                  style={{
                    width: "100%",
                    height: `${sortedTasks.length * 48}px`,
                    left: "288px", // 72 * 4 = 288px (w-72)
                  }}
                >
                  {dependencyLines.map((line, idx) => {
                    const chartWidth = days.length * 24; // Approximate width per day
                    const rowHeight = 48;
                    
                    const x1 = (line.x1 / 100) * chartWidth;
                    const y1 = line.y1 * rowHeight + rowHeight / 2;
                    const x2 = (line.x2 / 100) * chartWidth;
                    const y2 = line.y2 * rowHeight + rowHeight / 2;
                    
                    // Create a curved path
                    const midX = (x1 + x2) / 2;
                    const controlOffset = Math.min(20, Math.abs(y2 - y1) / 2);
                    
                    return (
                      <g key={idx}>
                        <path
                          d={`M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          opacity="0.6"
                        />
                        {/* Arrow head */}
                        <polygon
                          points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
                          fill="hsl(var(--primary))"
                          opacity="0.6"
                        />
                      </g>
                    );
                  })}
                </svg>

                {sortedTasks.map((task, rowIndex) => {
                  const position = getTaskPosition(task);
                  const hasDependencies = task.dependsOn && task.dependsOn.length > 0;
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-center border-b last:border-b-0 hover:bg-muted/20"
                    >
                      <div className="w-72 shrink-0 px-4 py-3 border-r">
                        <div className="flex items-center gap-2">
                          {hasDependencies && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Link2 className="h-3 w-3 text-primary shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Zależy od {task.dependsOn!.length} zadań
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "font-medium text-sm truncate",
                              task.status === "completed" && "line-through opacity-50"
                            )}>
                              {task.title}
                            </p>
                            {task.assignee && (
                              <p className="text-xs text-muted-foreground truncate">
                                {task.assignee}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 relative h-12 px-1">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex">
                          {days.map((day, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                "flex-1 min-w-[24px] border-r last:border-r-0",
                                isWeekend(day) && "bg-muted/30",
                                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") && "bg-primary/5"
                              )}
                            />
                          ))}
                        </div>
                        
                        {/* Task bar */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "absolute top-2 h-8 rounded-md cursor-pointer transition-all hover:scale-y-110 z-10",
                                priorityColors[task.priority] || "bg-blue-500",
                                statusColors[task.status]
                              )}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                minWidth: "24px",
                              }}
                            >
                              <span className="absolute inset-0 flex items-center px-2 text-xs text-white font-medium truncate">
                                {task.title}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{task.title}</p>
                              <p className="text-xs">
                                {format(task.startDate, "d MMM", { locale: pl })} - {format(task.endDate, "d MMM yyyy", { locale: pl })}
                              </p>
                              {task.assignee && (
                                <p className="text-xs text-muted-foreground">
                                  Przypisano: {task.assignee}
                                </p>
                              )}
                              {task.projectName && (
                                <p className="text-xs text-muted-foreground">
                                  Projekt: {task.projectName}
                                </p>
                              )}
                              {hasDependencies && (
                                <p className="text-xs text-primary">
                                  Zależy od {task.dependsOn!.length} zadań
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  );
}
