import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import TaskItem from "@/components/dashboard/TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const allTasks = [
  {
    id: "1",
    title: "Przygotowanie prezentacji brandingu",
    status: "in_progress" as const,
    priority: "high" as const,
    dueDate: "Dziś",
    assignee: "Anna K.",
    comments: 3,
    projectName: "Rebranding Klient ABC",
  },
  {
    id: "2",
    title: "Post Instagram - promocja świąteczna",
    status: "review" as const,
    priority: "urgent" as const,
    dueDate: "Jutro",
    attachments: 2,
    projectName: "Kampania Social Media",
  },
  {
    id: "3",
    title: "Wdrożenie strony głównej",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: "12 sty",
    assignee: "Piotr N.",
    projectName: "Strona WWW - XYZ Corp",
  },
  {
    id: "4",
    title: "Akceptacja kolorystyki",
    status: "review" as const,
    priority: "high" as const,
    dueDate: "10 sty",
    comments: 5,
    projectName: "Rebranding Klient ABC",
  },
  {
    id: "5",
    title: "Projekt logo - warianty",
    status: "completed" as const,
    priority: "high" as const,
    dueDate: "8 sty",
    attachments: 4,
    projectName: "Rebranding Klient ABC",
  },
  {
    id: "6",
    title: "Copywriting dla landing page",
    status: "todo" as const,
    priority: "low" as const,
    dueDate: "20 sty",
    projectName: "Strona WWW - XYZ Corp",
  },
  {
    id: "7",
    title: "Sesja zdjęciowa produktowa",
    status: "todo" as const,
    priority: "medium" as const,
    dueDate: "18 sty",
    assignee: "Tomek W.",
    projectName: "Kampania Social Media",
  },
  {
    id: "8",
    title: "Projekt banerów reklamowych",
    status: "in_progress" as const,
    priority: "medium" as const,
    dueDate: "15 sty",
    assignee: "Ewa S.",
    projectName: "Materiały reklamowe Q1",
  },
];

const statusColumns = [
  { id: "todo", label: "Do zrobienia", color: "bg-slate-500" },
  { id: "in_progress", label: "W trakcie", color: "bg-blue-500" },
  { id: "review", label: "Do akceptacji", color: "bg-amber-500" },
  { id: "completed", label: "Zakończone", color: "bg-emerald-500" },
];

const Tasks = () => {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status);
  };

  return (
    <DashboardLayout
      title="Zadania"
      userRole="client"
      showNewButton
      newButtonLabel="Nowe zadanie"
    >
      <div className="space-y-6">
        {/* Filters */}
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
                <SelectItem value="medium">Średni</SelectItem>
                <SelectItem value="low">Niski</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              Lista
            </Button>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-max">
            {statusColumns.map((column) => {
              const tasks = getTasksByStatus(column.id);
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
                        {tasks.length}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskItem key={task.id} {...task} />
                    ))}
                    {tasks.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        Brak zadań
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} {...task} />
            ))}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Brak zadań spełniających kryteria
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
