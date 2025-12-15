import { useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
  startOfWeek,
  endOfWeek,
  isToday,
  isPast,
} from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RequestCalendarProps {
  requests: ClientRequest[];
  onRequestClick: (request: ClientRequest) => void;
  onDeadlineChange: (id: string, deadline: string | null) => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 border-slate-300 text-slate-700",
  normal: "bg-blue-50 border-blue-200 text-blue-700",
  high: "bg-orange-50 border-orange-200 text-orange-700",
  urgent: "bg-red-50 border-red-300 text-red-700",
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getRequestsForDay = (day: Date) => {
    return requests.filter((r) => {
      if (!r.deadline) return false;
      return isSameDay(new Date(r.deadline), day);
    });
  };

  // Also get requests without deadlines
  const unscheduledRequests = requests.filter((r) => !r.deadline && r.status !== "completed" && r.status !== "cancelled");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const requestId = result.draggableId;
    const destId = result.destination.droppableId;

    if (destId === "unscheduled") {
      onDeadlineChange(requestId, null);
    } else {
      // destId is in format "day-YYYY-MM-DD"
      const dateStr = destId.replace("day-", "");
      onDeadlineChange(requestId, dateStr);
    }
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[180px] text-center">
              {format(currentMonth, "LLLL yyyy", { locale: pl })}
            </h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Dziś
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          {/* Calendar Grid */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/50">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayRequests = getRequestsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
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
                            <Draggable
                              key={request.id}
                              draggableId={request.id}
                              index={idx}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "text-xs p-1.5 rounded border cursor-pointer transition-all truncate",
                                    priorityColors[request.priority],
                                    snapshot.isDragging && "shadow-lg ring-2 ring-primary/30"
                                  )}
                                  onClick={() => onRequestClick(request)}
                                >
                                  <div className="flex items-center gap-1">
                                    <div
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full flex-shrink-0",
                                        statusConfig[request.status].dotColor
                                      )}
                                    />
                                    <span className="truncate">{request.title}</span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
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
                    snapshot.isDraggingOver && "bg-orange-50 ring-2 ring-orange-200"
                  )}
                >
                  {unscheduledRequests.map((request, index) => (
                    <Draggable
                      key={request.id}
                      draggableId={request.id}
                      index={index}
                    >
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
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full flex-shrink-0",
                                statusConfig[request.status].dotColor
                              )}
                            />
                            <span className="font-medium truncate">
                              {request.title}
                            </span>
                          </div>
                          {request.assigned_member && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                  {request.assigned_member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)}
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
