import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid3X3, List } from "lucide-react";

const projects = [
  {
    id: "1",
    name: "Rebranding Klient ABC",
    description: "Kompletny rebranding marki, logo i materiały marketingowe dla firmy ABC. Projekt obejmuje nową identyfikację wizualną.",
    progress: 65,
    tasksCompleted: 13,
    totalTasks: 20,
    dueDate: "15 sty",
    status: "active" as const,
    team: [{ name: "Anna K." }, { name: "Michał P." }, { name: "Ewa S." }],
  },
  {
    id: "2",
    name: "Kampania Social Media",
    description: "Prowadzenie profili i tworzenie contentu na Instagram, Facebook i LinkedIn",
    progress: 40,
    tasksCompleted: 8,
    totalTasks: 20,
    dueDate: "30 sty",
    status: "active" as const,
    team: [{ name: "Tomek W." }, { name: "Kasia M." }],
  },
  {
    id: "3",
    name: "Strona WWW - XYZ Corp",
    description: "Projekt i wdrożenie nowej strony firmowej z systemem CMS",
    progress: 90,
    tasksCompleted: 18,
    totalTasks: 20,
    dueDate: "10 sty",
    status: "active" as const,
    team: [
      { name: "Piotr N." },
      { name: "Anna K." },
      { name: "Michał P." },
      { name: "Ewa S." },
      { name: "Jan Z." },
    ],
  },
  {
    id: "4",
    name: "Materiały reklamowe Q1",
    description: "Projekt ulotek, plakatów i banerów reklamowych na pierwszy kwartał",
    progress: 25,
    tasksCompleted: 5,
    totalTasks: 20,
    dueDate: "28 lut",
    status: "active" as const,
    team: [{ name: "Ewa S." }, { name: "Kasia M." }],
  },
  {
    id: "5",
    name: "Video Marketing",
    description: "Seria filmów promocyjnych dla YouTube i TikTok",
    progress: 100,
    tasksCompleted: 15,
    totalTasks: 15,
    dueDate: "1 sty",
    status: "completed" as const,
    team: [{ name: "Tomek W." }],
  },
  {
    id: "6",
    name: "Email Marketing Setup",
    description: "Konfiguracja i projekt szablonów newslettera",
    progress: 0,
    tasksCompleted: 0,
    totalTasks: 8,
    dueDate: "15 mar",
    status: "paused" as const,
    team: [{ name: "Anna K." }],
  },
];

const Projects = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout
      title="Projekty"
      userRole="client"
      showNewButton
      newButtonLabel="Nowy projekt"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj projektów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="paused">Wstrzymane</SelectItem>
                <SelectItem value="completed">Zakończone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Brak projektów spełniających kryteria
            </p>
            <p className="text-sm text-muted-foreground">
              Spróbuj zmienić filtry lub frazę wyszukiwania
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Projects;
