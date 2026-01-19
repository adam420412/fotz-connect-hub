import { useMemo } from "react";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWeekend } from "date-fns";
import { pl } from "date-fns/locale";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GanttTask {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  priority: string;
  assignee?: string;
  projectName?: string;
}

interface ProjectGanttChartProps {
  tasks: GanttTask[];
  startDate?: Date;
  endDate?: Date;
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
  completed: "opacity-40 line-through",
  cancelled: "opacity-30",
};

export function ProjectGanttChart({ tasks, startDate, endDate }: ProjectGanttChartProps) {
  const { days, chartStart, chartEnd } = useMemo(() => {
    const now = new Date();
    const start = startDate || startOfMonth(now);
    const end = endDate || endOfMonth(addDays(now, 60));
    
    return {
      days: eachDayOfInterval({ start, end }),
      chartStart: start,
      chartEnd: end,
    };
  }, [startDate, endDate]);

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.max(0, differenceInDays(task.startDate, chartStart));
    const duration = Math.max(1, differenceInDays(task.endDate, task.startDate) + 1);
    const totalDays = days.length;
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Brak zadań z datami do wyświetlenia
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-lg border bg-card">
        <ScrollArea className="w-full">
          <div className="min-w-[1200px]">
            {/* Header with dates */}
            <div className="sticky top-0 z-10 bg-card border-b">
              <div className="flex">
                <div className="w-64 shrink-0 px-4 py-2 font-medium border-r bg-muted/50">
                  Zadanie
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

            {/* Task rows */}
            <div>
              {sortedTasks.map((task) => {
                const position = getTaskPosition(task);
                
                return (
                  <div
                    key={task.id}
                    className="flex items-center border-b last:border-b-0 hover:bg-muted/20"
                  >
                    <div className="w-64 shrink-0 px-4 py-3 border-r">
                      <p className={cn(
                        "font-medium text-sm truncate",
                        statusColors[task.status]
                      )}>
                        {task.title}
                      </p>
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.assignee}
                        </p>
                      )}
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
                              "absolute top-2 h-8 rounded-md cursor-pointer transition-all hover:scale-y-110",
                              priorityColors[task.priority] || "bg-blue-500",
                              statusColors[task.status]
                            )}
                            style={{
                              left: position.left,
                              width: position.width,
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
    </TooltipProvider>
  );
}
