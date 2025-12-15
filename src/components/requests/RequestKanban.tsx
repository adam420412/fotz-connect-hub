import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { ClientRequest } from "@/hooks/useClientRequests";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RequestKanbanProps {
  requests: ClientRequest[];
  onRequestClick: (request: ClientRequest) => void;
  onStatusChange: (id: string, status: ClientRequest["status"]) => void;
}

const statusColumns = [
  { id: "pending", label: "Oczekujące", color: "bg-slate-500" },
  { id: "in_progress", label: "W realizacji", color: "bg-blue-500" },
  { id: "completed", label: "Zakończone", color: "bg-emerald-500" },
  { id: "cancelled", label: "Anulowane", color: "bg-red-500" },
];

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Niski", className: "text-muted-foreground" },
  normal: { label: "Normalny", className: "text-foreground" },
  high: { label: "Wysoki", className: "text-orange-600" },
  urgent: { label: "Pilny", className: "text-destructive font-semibold" },
};

const getDeadlineInfo = (deadline: string | null) => {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isPast(deadlineDate) && !isToday(deadlineDate)) {
    return { text: "Po terminie!", className: "text-destructive", urgent: true };
  }
  if (isToday(deadlineDate)) {
    return { text: "Dziś", className: "text-orange-600", urgent: true };
  }
  if (isTomorrow(deadlineDate)) {
    return { text: "Jutro", className: "text-orange-500", urgent: false };
  }
  const days = differenceInDays(deadlineDate, today);
  if (days <= 3) {
    return { text: `Za ${days} dni`, className: "text-yellow-600", urgent: false };
  }
  return { text: format(deadlineDate, "d MMM", { locale: pl }), className: "text-muted-foreground", urgent: false };
};

const RequestKanban = ({ requests, onRequestClick, onStatusChange }: RequestKanbanProps) => {
  const getRequestsByStatus = (status: string) => {
    return requests.filter((r) => r.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceStatus = result.source.droppableId;
    const destStatus = result.destination.droppableId;
    
    if (sourceStatus !== destStatus) {
      const requestId = result.draggableId;
      onStatusChange(requestId, destStatus as ClientRequest["status"]);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {statusColumns.map((column) => {
          const columnRequests = getRequestsByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className="rounded-xl border border-border bg-card/50 p-4 min-h-[300px]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", column.color)} />
                  <h3 className="font-medium text-foreground">{column.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {columnRequests.length}
                  </span>
                </div>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-3 min-h-[200px] rounded-lg p-1 transition-colors",
                      snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
                    )}
                  >
                    {columnRequests.map((request, index) => {
                      const deadlineInfo = getDeadlineInfo(request.deadline);
                      
                      return (
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
                                "rounded-lg border border-border bg-card p-3 cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm",
                                snapshot.isDragging && "shadow-lg ring-2 ring-primary/30",
                                deadlineInfo?.urgent && "border-l-4 border-l-destructive"
                              )}
                              onClick={() => onRequestClick(request)}
                            >
                              <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                                {request.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={priorityConfig[request.priority].className}>
                                  {priorityConfig[request.priority].label}
                                </span>
                                
                                {deadlineInfo && (
                                  <span className={cn("flex items-center gap-1", deadlineInfo.className)}>
                                    {deadlineInfo.urgent ? (
                                      <AlertTriangle className="h-3 w-3" />
                                    ) : (
                                      <Calendar className="h-3 w-3" />
                                    )}
                                    {deadlineInfo.text}
                                  </span>
                                )}
                              </div>
                              
                              {request.assigned_member && (
                                <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                      {request.assigned_member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
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
                      );
                    })}
                    {provided.placeholder}
                    {columnRequests.length === 0 && !snapshot.isDraggingOver && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Brak zadań
                      </p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default RequestKanban;
