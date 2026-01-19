import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientRequest } from "@/hooks/useClientRequests";
import TaskItem from "@/components/dashboard/TaskItem";
import { QuickTaskDialog } from "./QuickTaskDialog";
import { notifyTaskStatusChange } from "@/utils/slackNotifications";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  pending: "Oczekujące",
  in_progress: "W trakcie",
  completed: "Zakończone",
  cancelled: "Anulowane",
};

const statusColumns = [
  { id: "pending", label: "Oczekujące", color: "bg-amber-500" },
  { id: "in_progress", label: "W trakcie", color: "bg-blue-500" },
  { id: "completed", label: "Zakończone", color: "bg-emerald-500" },
  { id: "cancelled", label: "Anulowane", color: "bg-slate-500" },
];

interface TaskKanbanBoardProps {
  tasks: ClientRequest[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: ClientRequest) => void;
}

export function TaskKanbanBoard({ tasks, onStatusChange, onTaskClick }: TaskKanbanBoardProps) {
  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const convertToTaskItem = (task: ClientRequest) => ({
    id: task.id,
    title: task.title,
    status: task.status === "pending" ? "todo" as const 
      : task.status === "in_progress" ? "in_progress" as const 
      : task.status === "completed" ? "completed" as const 
      : "todo" as const,
    priority: task.priority === "urgent" ? "urgent" as const 
      : task.priority === "high" ? "high" as const 
      : task.priority === "low" ? "low" as const 
      : "medium" as const,
    dueDate: task.deadline || undefined,
    assignee: task.assigned_member?.name,
    projectName: task.category?.name,
  });

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a droppable area
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Status changed
    if (destination.droppableId !== source.droppableId) {
      onStatusChange(draggableId, destination.droppableId);
      
      // Send Slack notification
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single();
          
          notifyTaskStatusChange(
            task.title,
            statusLabels[source.droppableId] || source.droppableId,
            statusLabels[destination.droppableId] || destination.droppableId,
            profile?.full_name || profile?.email || "Użytkownik"
          );
        }
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-max">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              className="rounded-xl border border-border bg-card/50 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", column.color)} />
                  <h3 className="font-medium">{column.label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>
                <QuickTaskDialog
                  defaultStatus={column.id}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-3 min-h-[100px] rounded-lg transition-colors",
                      snapshot.isDraggingOver && "bg-muted/50"
                    )}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTaskClick(task)}
                            className={cn(
                              "cursor-pointer transition-shadow",
                              snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                            )}
                          >
                            <TaskItem {...convertToTaskItem(task)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
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
}
