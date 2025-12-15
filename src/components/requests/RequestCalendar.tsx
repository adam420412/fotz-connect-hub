import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { ClientRequest } from "@/hooks/useClientRequests";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isToday,
  isPast,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  setHours,
} from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RequestCalendarProps {
  requests: ClientRequest[];
  onRequestClick: (request: ClientRequest) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}

type CalendarView = "month" | "week" | "day";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300",
  normal: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
  high: "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300",
  urgent: "bg-red-50 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Niski", className: "text-muted-foreground" },
  normal: { label: "Normalny", className: "text-foreground" },
  high: { label: "Wysoki", className: "text-orange-600" },
  urgent: { label: "Pilny", className: "text-destructive font-semibold" },
};

const statusConfig: Record<string, { label: string; dotColor: string }> = {
  pending: { label: "Oczekuje", dotColor: "bg-slate-400" },
  in_progress: { label: "W realizacji", dotColor: "bg-blue-500" },
  completed: { label: "Zakończone", dotColor: "bg-emerald-500" },
  cancelled: { label: "Anulowane", dotColor: "bg-red-400" },
};

const RequestCalendar = ({
  requests,
  onRequestClick,
  onDeadlineChange,
}: RequestCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");

  // Get days based on current view
  const calendarDays = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  }, [currentDate, view]);

  // Hours for day/week view
  const hours = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  const getRequestsForDay = (day: Date) => {
    return requests.filter((r) => {
      if (!r.deadline) return false;
      return isSameDay(new Date(r.deadline), day);
    });
  };

  const unscheduledRequests = requests.filter(
    (r) => !r.deadline && r.status !== "completed" && r.status !== "cancelled"
  );

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const requestId = result.draggableId;
    const destId = result.destination.droppableId;

    if (destId === "unscheduled") {
      onDeadlineChange(requestId, null);
    } else {
      const dateStr = destId.replace("day-", "");
      onDeadlineChange(requestId, dateStr);
    }
  };

  const navigate = (direction: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    if (view === "month") {
      return format(currentDate, "LLLL yyyy", { locale: pl });
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: pl })} - ${format(end, "d MMM yyyy", { locale: pl })}`;
    } else {
      return format(currentDate, "EEEE, d MMMM yyyy", { locale: pl });
    }
  };

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
  const weekDaysFull = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

  // Task Card Component for reuse
  const TaskCard = ({ request, index, compact = false }: { request: ClientRequest; index: number; compact?: boolean }) => (
    <Draggable key={request.id} draggableId={request.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "rounded border cursor-pointer transition-all",
            priorityColors[request.priority],
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/30",
            compact ? "text-xs p-1.5" : "text-sm p-2"
          )}
          onClick={() => onRequestClick(request)}
        >
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "rounded-full flex-shrink-0",
                statusConfig[request.status].dotColor,
                compact ? "h-1.5 w-1.5" : "h-2 w-2"
              )}
            />
            <span className="truncate font-medium">{request.title}</span>
          </div>
          {!compact && (
            <>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {statusConfig[request.status].label}
                </Badge>
                <span className={priorityConfig[request.priority].className}>
                  {priorityConfig[request.priority].label}
                </span>
              </div>
              {request.assigned_member && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Avatar className="h-4 w-4">
                    <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                      {request.assigned_member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground truncate">
                    {request.assigned_member.name}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Draggable>
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[220px] text-center capitalize">
              {getHeaderTitle()}
            </h3>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Dziś
            </Button>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button
                variant={view === "month" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setView("month")}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Miesiąc
              </Button>
              <Button
                variant={view === "week" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setView("week")}
              >
                <CalendarRange className="h-4 w-4 mr-1" />
                Tydzień
              </Button>
              <Button
                variant={view === "day" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setView("day")}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Dzień
              </Button>
            </div>
          </div>
        </div>

        <div className={cn(
          "grid gap-4",
          view === "day" ? "grid-cols-1 xl:grid-cols-[1fr_280px]" : "grid-cols-1 xl:grid-cols-[1fr_280px]"
        )}>
          {/* Month View */}
          {view === "month" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayRequests = getRequestsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isDayToday = isToday(day);
                  const isDayPast = isPast(day) && !isDayToday;
                  const dateStr = format(day, "yyyy-MM-dd");

                  return (
                    <Droppable key={dateStr} droppableId={`day-${dateStr}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "min-h-[100px] border-b border-r border-border p-1 transition-colors",
                            !isCurrentMonth && "bg-muted/30",
                            isDayToday && "bg-primary/5",
                            snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/20 ring-inset",
                            index % 7 === 6 && "border-r-0"
                          )}
                        >
                          <div
                            className={cn(
                              "text-sm font-medium mb-1 h-6 w-6 flex items-center justify-center rounded-full",
                              !isCurrentMonth && "text-muted-foreground",
                              isDayToday && "bg-primary text-primary-foreground",
                              isDayPast && isCurrentMonth && "text-muted-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                          <div className="space-y-1">
                            {dayRequests.slice(0, 3).map((request, idx) => (
                              <TaskCard key={request.id} request={request} index={idx} compact />
                            ))}
                            {dayRequests.length > 3 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{dayRequests.length - 3} więcej
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
            </div>
          )}

          {/* Week View */}
          {view === "week" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header with day names */}
              <div className="grid grid-cols-7 border-b border-border bg-muted/50">
                {calendarDays.map((day, index) => {
                  const isDayToday = isToday(day);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-3 text-center border-r border-border last:border-r-0",
                        isDayToday && "bg-primary/10"
                      )}
                    >
                      <div className="text-xs text-muted-foreground uppercase">
                        {weekDays[index]}
                      </div>
                      <div
                        className={cn(
                          "text-lg font-semibold mt-1",
                          isDayToday && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Week grid with tasks */}
              <div className="grid grid-cols-7 min-h-[400px]">
                {calendarDays.map((day, dayIndex) => {
                  const dayRequests = getRequestsForDay(day);
                  const isDayToday = isToday(day);
                  const dateStr = format(day, "yyyy-MM-dd");

                  return (
                    <Droppable key={dateStr} droppableId={`day-${dateStr}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "border-r border-border last:border-r-0 p-2 transition-colors",
                            isDayToday && "bg-primary/5",
                            snapshot.isDraggingOver && "bg-primary/10 ring-2 ring-primary/20 ring-inset"
                          )}
                        >
                          <div className="space-y-2">
                            {dayRequests.map((request, idx) => (
                              <TaskCard key={request.id} request={request} index={idx} />
                            ))}
                          </div>
                          {provided.placeholder}
                          {dayRequests.length === 0 && !snapshot.isDraggingOver && (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              Brak zadań
                            </p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day View */}
          {view === "day" && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Day header */}
              <div className="p-4 border-b border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {format(currentDate, "EEEE", { locale: pl })}
                    </div>
                    <div className={cn(
                      "text-2xl font-bold",
                      isToday(currentDate) && "text-primary"
                    )}>
                      {format(currentDate, "d MMMM yyyy", { locale: pl })}
                    </div>
                  </div>
                  {isToday(currentDate) && (
                    <Badge variant="default">Dziś</Badge>
                  )}
                </div>
              </div>

              {/* Tasks for the day */}
              <Droppable droppableId={`day-${format(currentDate, "yyyy-MM-dd")}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-4 min-h-[400px] transition-colors",
                      snapshot.isDraggingOver && "bg-primary/10"
                    )}
                  >
                    {(() => {
                      const dayRequests = getRequestsForDay(currentDate);
                      
                      if (dayRequests.length === 0 && !snapshot.isDraggingOver) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
                            <h4 className="font-medium text-foreground mb-1">Brak zadań na ten dzień</h4>
                            <p className="text-sm text-muted-foreground">
                              Przeciągnij zadanie tutaj lub wybierz inny dzień
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground mb-3">
                            Zadania ({dayRequests.length})
                          </h4>
                          {dayRequests.map((request, idx) => (
                            <div
                              key={request.id}
                              className={cn(
                                "rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md",
                                priorityColors[request.priority]
                              )}
                              onClick={() => onRequestClick(request)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={cn("h-2.5 w-2.5 rounded-full", statusConfig[request.status].dotColor)} />
                                    <h5 className="font-semibold">{request.title}</h5>
                                  </div>
                                  {request.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                      {request.description.split("\n")[0]}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                      {statusConfig[request.status].label}
                                    </Badge>
                                    <span className={cn("text-sm", priorityConfig[request.priority].className)}>
                                      {priorityConfig[request.priority].label}
                                    </span>
                                  </div>
                                </div>
                                {request.assigned_member && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                        {request.assigned_member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">{request.assigned_member.name}</p>
                                      <p className="text-xs text-muted-foreground">{request.assigned_member.email}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}

          {/* Unscheduled Tasks Sidebar */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Bez terminu ({unscheduledRequests.length})
            </h4>
            <Droppable droppableId="unscheduled">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "space-y-2 min-h-[200px] rounded-lg p-2 transition-colors",
                    snapshot.isDraggingOver && "bg-orange-50 dark:bg-orange-950/30 ring-2 ring-orange-200 dark:ring-orange-800"
                  )}
                >
                  {unscheduledRequests.map((request, index) => (
                    <Draggable key={request.id} draggableId={request.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "text-sm p-2 rounded-lg border cursor-pointer transition-all",
                            priorityColors[request.priority],
                            snapshot.isDragging && "shadow-lg ring-2 ring-primary/30"
                          )}
                          onClick={() => onRequestClick(request)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <div className={cn("h-2 w-2 rounded-full flex-shrink-0", statusConfig[request.status].dotColor)} />
                            <span className="font-medium truncate">{request.title}</span>
                          </div>
                          {request.assigned_member && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                  {request.assigned_member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate">
                                {request.assigned_member.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unscheduledRequests.length === 0 && !snapshot.isDraggingOver && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Wszystkie zadania mają termin
                    </p>
                  )}
                </div>
              )}
            </Droppable>
            <p className="text-xs text-muted-foreground mt-3">
              Przeciągnij zadanie na datę w kalendarzu, aby ustawić termin
            </p>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default RequestCalendar;
