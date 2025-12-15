import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  UserPlus,
  Mail,
  CheckSquare,
  Clock,
  BarChart3,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  initials: string;
  activeTasks: number;
  completedTasks: number;
  workload: number;
  status: "online" | "offline" | "busy";
}

const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "Anna Kowalska",
    email: "anna.k@fotz.pl",
    role: "Senior Designer",
    initials: "AK",
    activeTasks: 5,
    completedTasks: 23,
    workload: 80,
    status: "online",
  },
  {
    id: "2",
    name: "Michał Piotrowski",
    email: "michal.p@fotz.pl",
    role: "Project Manager",
    initials: "MP",
    activeTasks: 8,
    completedTasks: 45,
    workload: 95,
    status: "busy",
  },
  {
    id: "3",
    name: "Ewa Szymańska",
    email: "ewa.s@fotz.pl",
    role: "Graphic Designer",
    initials: "ES",
    activeTasks: 3,
    completedTasks: 18,
    workload: 45,
    status: "online",
  },
  {
    id: "4",
    name: "Piotr Nowak",
    email: "piotr.n@fotz.pl",
    role: "Web Developer",
    initials: "PN",
    activeTasks: 4,
    completedTasks: 31,
    workload: 60,
    status: "online",
  },
  {
    id: "5",
    name: "Tomek Wiśniewski",
    email: "tomek.w@fotz.pl",
    role: "Video Editor",
    initials: "TW",
    activeTasks: 2,
    completedTasks: 15,
    workload: 35,
    status: "offline",
  },
  {
    id: "6",
    name: "Kasia Mazur",
    email: "kasia.m@fotz.pl",
    role: "Content Writer",
    initials: "KM",
    activeTasks: 6,
    completedTasks: 28,
    workload: 70,
    status: "online",
  },
];

const statusConfig = {
  online: { label: "Online", className: "bg-green-500" },
  offline: { label: "Offline", className: "bg-muted-foreground" },
  busy: { label: "Zajęty", className: "bg-destructive" },
};

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = mockTeamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTasks = mockTeamMembers.reduce((acc, m) => acc + m.activeTasks, 0);
  const avgWorkload = Math.round(
    mockTeamMembers.reduce((acc, m) => acc + m.workload, 0) / mockTeamMembers.length
  );

  return (
    <DashboardLayout title="Zespół">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Członków zespołu</p>
                <p className="text-2xl font-bold text-foreground">{mockTeamMembers.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <CheckSquare className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktywne zadania</p>
                <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Średnie obciążenie</p>
                <p className="text-2xl font-bold text-foreground">{avgWorkload}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj członka zespołu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="gradient" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Dodaj członka
          </Button>
        </div>

        {/* Team Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-fotz text-primary-foreground font-medium">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${statusConfig[member.status].className}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Obciążenie</span>
                  <span className={`font-medium ${member.workload > 85 ? "text-destructive" : "text-foreground"}`}>
                    {member.workload}%
                  </span>
                </div>
                <Progress value={member.workload} className="h-2" />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    <span className="text-foreground">{member.activeTasks} aktywnych</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{member.completedTasks} ukończonych</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Team;
