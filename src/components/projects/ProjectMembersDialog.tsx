import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, UserMinus, Clock, Loader2, X } from "lucide-react";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { useTimeTracking, formatDuration } from "@/hooks/useTimeTracking";
import { useTeamMemberRates } from "@/hooks/useTeamMemberRates";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface ProjectMembersDialogProps {
  projectId: string;
  projectName: string;
}

export function ProjectMembersDialog({ projectId, projectName }: ProjectMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("none");
  const { 
    members, 
    isLoading, 
    joinProject, 
    leaveProject, 
    addMemberToProject,
    removeMemberFromProject,
    isJoining, 
    isLeaving,
    isAdding,
    isProjectMember 
  } = useProjectMembers(projectId);
  const { entries } = useTimeTracking();
  const { getRateForUser, calculateEarnings } = useTeamMemberRates();
  const { teamMembers } = useTeamMembers();

  const isMember = isProjectMember(projectId);

  // Get profiles for members
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ["member-profiles", members.map(m => m.user_id)],
    queryFn: async () => {
      if (members.length === 0) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", members.map(m => m.user_id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: members.length > 0,
  });

  // Calculate time per member for this project
  const memberTimeMap = new Map<string, number>();
  entries
    .filter((e) => e.project_id === projectId && e.duration_minutes)
    .forEach((e) => {
      const current = memberTimeMap.get(e.user_id) || 0;
      memberTimeMap.set(e.user_id, current + (e.duration_minutes || 0));
    });

  const getProfile = (userId: string) => {
    return memberProfiles.find(p => p.id === userId);
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "??";
  };

  // Filter team members not already in project
  const availableMembers = teamMembers.filter(
    tm => !members.some(m => m.user_id === tm.id)
  );

  const handleAddMember = () => {
    if (selectedUserId === "none") return;
    addMemberToProject({ projectId, userId: selectedUserId, projectName });
    setSelectedUserId("none");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Członkowie ({members.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Członkowie projektu</DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Join/Leave button */}
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Dodaj członka..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Wybierz...</SelectItem>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddMember}
                disabled={selectedUserId === "none" || isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {isMember ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => leaveProject(projectId)}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserMinus className="h-4 w-4 mr-2" />
                )}
                Opuść
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => joinProject(projectId, projectName)}
                disabled={isJoining}
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Dołącz
              </Button>
            )}
          </div>

          {/* Members list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Brak członków w tym projekcie
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {members.map((member) => {
                const profile = getProfile(member.user_id);
                const totalMinutes = memberTimeMap.get(member.user_id) || 0;
                const earnings = calculateEarnings(member.user_id, totalMinutes);
                const rate = getRateForUser(member.user_id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(profile?.full_name || null, profile?.email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {profile?.full_name || profile?.email || member.user_id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(totalMinutes)}</span>
                        {rate && (
                          <Badge variant="outline" className="text-xs">
                            {rate.hourly_rate} {rate.currency}/h
                          </Badge>
                        )}
                      </div>
                    </div>

                    {earnings && (
                      <div className="text-right">
                        <p className="font-semibold text-sm text-primary">
                          {earnings.amount.toFixed(2)} {earnings.currency}
                        </p>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeMemberFromProject({ projectId, userId: member.user_id })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
