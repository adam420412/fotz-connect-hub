import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskItem from "@/components/dashboard/TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, LayoutGrid, List, CalendarDays, Loader2, Zap } from "lucide-react";
import { useClientRequests, ClientRequest } from "@/hooks/useClientRequests";
import { TaskCalendar } from "@/components/calendar/TaskCalendar";
import RequestDetailsDialog from "@/components/requests/RequestDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { QuickTaskDialog } from "@/components/tasks/QuickTaskDialog";
import { TaskKanbanBoard } from "@/components/tasks/TaskKanbanBoard";

const Tasks = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<ClientRequest | null>(null);
  const { requests, isLoading, updateRequest } = useClientRequests();
  const { toast } = useToast();

  const handleNewTask = () => {
    navigate("/new-request");
  };

  const filteredTasks = requests.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleUpdateDeadline = (taskId: string, newDeadline: string) => {
    updateRequest({ id: taskId, deadline: newDeadline });
    toast({
      title: "Termin zaktualizowany",
      description: `Nowy termin: ${newDeadline}`,
    });
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateRequest({ id: taskId, status: newStatus as ClientRequest["status"] });
    toast({
      title: "Status zaktualizowany",
      description: "Zadanie zostało przeniesione",
    });
  };

  // Convert ClientRequest to TaskItem format for compatibility
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

  if (isLoading) {
    return (
      <DashboardLayout title="Zadania">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Zadania"
      showNewButton
      newButtonLabel="Nowe zadanie"
      onNewClick={handleNewTask}
    >
      <Tabs defaultValue="kanban" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj zadań..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priorytet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="urgent">Pilne</SelectItem>
                <SelectItem value="high">Wysoki</SelectItem>
                <SelectItem value="normal">Normalny</SelectItem>
                <SelectItem value="low">Niski</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Quick Task Button */}
            <QuickTaskDialog
              trigger={
                <Button variant="secondary" size="sm" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Szybkie zadanie
                </Button>
              }
            />
          </div>

          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Kalendarz
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Kanban View with Drag & Drop */}
        <TabsContent value="kanban">
          <TaskKanbanBoard
            tasks={filteredTasks}
            onStatusChange={handleStatusChange}
            onTaskClick={setSelectedTask}
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="cursor-pointer"
              >
                <TaskItem {...convertToTaskItem(task)} />
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Brak zadań spełniających kryteria
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <TaskCalendar
            requests={filteredTasks}
            onUpdateDeadline={handleUpdateDeadline}
            onTaskClick={setSelectedTask}
          />
        </TabsContent>
      </Tabs>

      {/* Task Details Dialog */}
      {selectedTask && (
        <RequestDetailsDialog
          request={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onStatusChange={(id, status) => {
            updateRequest({ id, status });
            setSelectedTask(null);
          }}
          onDeadlineChange={(id, deadline) => {
            updateRequest({ id, deadline });
          }}
          onAssign={(id, assignedTo) => {
            updateRequest({ id, assigned_to: assignedTo });
          }}
          isTeamMember
        />
      )}
    </DashboardLayout>
  );
};

export default Tasks;
