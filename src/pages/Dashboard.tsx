import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import TaskItem from "@/components/dashboard/TaskItem";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { FolderKanban, CheckSquare, Clock, FileCheck } from "lucide-react";

// Mock data
const stats = [
  {
    title: "Aktywne projekty",
    value: 4,
    icon: FolderKanban,
    trend: { value: 12, positive: true },
  },
  {
    title: "Zadania w toku",
    value: 12,
    icon: CheckSquare,
    description: "3 do akceptacji",
  },
  {
    title: "Do akceptacji",
    value: 5,
    icon: FileCheck,
    description: "Pliki i materiały",
  },
  {
    title: "Czas realizacji",
    value: "2.3d",
    icon: Clock,
    trend: { value: 8, positive: false },
  },
];

const projects = [
  {
    id: "1",
    name: "Rebranding Klient ABC",
    description: "Kompletny rebranding marki, logo i materiały marketingowe",
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
    description: "Prowadzenie profili i tworzenie contentu",
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
    description: "Projekt i wdrożenie nowej strony firmowej",
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
];

const tasks = [
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
];

const activities = [
  {
    id: "1",
    type: "comment" as const,
    title: "Nowy komentarz w zadaniu",
    description: 'Komentarz do "Przygotowanie prezentacji brandingu"',
    time: "5 min temu",
    user: { name: "Michał P." },
  },
  {
    id: "2",
    type: "file_approved" as const,
    title: "Plik zaakceptowany",
    description: "Logo_final_v3.ai został zaakceptowany przez klienta",
    time: "1 godz. temu",
    user: { name: "Klient ABC" },
  },
  {
    id: "3",
    type: "task_completed" as const,
    title: "Zadanie ukończone",
    description: 'Zakończono "Projekt wizytówek firmowych"',
    time: "2 godz. temu",
    user: { name: "Ewa S." },
  },
  {
    id: "4",
    type: "file_uploaded" as const,
    title: "Nowy plik dodany",
    description: 'Dodano "Mockup_strona_glowna.fig"',
    time: "3 godz. temu",
    user: { name: "Piotr N." },
  },
];

const Dashboard = () => {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Projects */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Aktywne projekty</h2>
              <a
                href="/projects"
                className="text-sm text-primary hover:underline"
              >
                Zobacz wszystkie
              </a>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {projects.slice(0, 2).map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <RecentActivity activities={activities} />
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ostatnie zadania</h2>
            <a href="/tasks" className="text-sm text-primary hover:underline">
              Zobacz wszystkie
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tasks.map((task) => (
              <TaskItem key={task.id} {...task} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
