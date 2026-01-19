import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  Mail,
  CheckSquare,
  Clock,
  BarChart3,
  Loader2,
} from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useClientRequests } from "@/hooks/useClientRequests";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const statusConfig = {
  online: { label: "Online", className: "bg-green-500" },
  offline: { label: "Offline", className: "bg-muted-foreground" },
  busy: { label: "Zajęty", className: "bg-destructive" },
};

const Team = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Designer");
  
  const { teamMembers, isLoading } = useTeamMembers();
  const { requests } = useClientRequests();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addTeamMember = useMutation({
    mutationFn: async (data: { name: string; email: string; role: string }) => {
      const { error } = await supabase
        .from("team_members")
        .insert({
          name: data.name,
          email: data.email,
          role: data.role,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Dodano członka zespołu",
        description: "Nowy członek zespołu został dodany pomyślnie",
      });
      setIsAddDialogOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("Designer");
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive",
      });
      return;
    }
    addTeamMember.mutate({
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole,
    });
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats from real data
  const getTasksForMember = (memberId: string) => {
    return requests.filter(r => r.assigned_to === memberId && r.status !== "completed").length;
  };

  const getCompletedTasksForMember = (memberId: string) => {
    return requests.filter(r => r.assigned_to === memberId && r.status === "completed").length;
  };

  const totalTasks = requests.filter(r => r.status !== "completed").length;
  const avgWorkload = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((acc, m) => acc + getTasksForMember(m.id), 0) / teamMembers.length * 10) 
    : 0;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Zespół">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

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
                <p className="text-2xl font-bold text-foreground">{teamMembers.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{avgWorkload} zadań</p>
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
          <Button variant="gradient" className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Dodaj członka
          </Button>
        </div>

        {/* Team Grid */}
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Brak członków zespołu</h3>
            <p className="text-muted-foreground mb-4">Dodaj pierwszego członka zespołu</p>
            <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Dodaj członka
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => {
              const activeTasks = getTasksForMember(member.id);
              const completedTasks = getCompletedTasksForMember(member.id);
              const workload = Math.min(activeTasks * 20, 100);
              
              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-fotz text-primary-foreground font-medium">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${member.is_active ? "bg-green-500" : "bg-muted-foreground"}`}
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
                      <span className={`font-medium ${workload > 85 ? "text-destructive" : "text-foreground"}`}>
                        {workload}%
                      </span>
                    </div>
                    <Progress value={workload} className="h-2" />

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 text-sm">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        <span className="text-foreground">{activeTasks} aktywnych</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{completedTasks} ukończonych</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj członka zespołu</DialogTitle>
            <DialogDescription>
              Dodaj nowego członka do zespołu FOTZ Studio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input
                id="name"
                placeholder="np. Jan Kowalski"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="np. jan@fotz.pl"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rola</Label>
              <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Designer">Designer</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Content Writer">Content Writer</SelectItem>
                  <SelectItem value="Video Editor">Video Editor</SelectItem>
                  <SelectItem value="Marketing Specialist">Marketing Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleAddMember} disabled={addTeamMember.isPending}>
              {addTeamMember.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dodaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Team;
