import { useState } from "react";
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
import { Users, UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { useTimeTracking, formatDuration } from "@/hooks/useTimeTracking";
import { useTeamMemberRates } from "@/hooks/useTeamMemberRates";

interface ProjectMembersDialogProps {
  projectId: string;
  projectName: string;
}

export function ProjectMembersDialog({ projectId, projectName }: ProjectMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const { 
    members, 
    isLoading, 
    joinProject, 
    leaveProject, 
    isJoining, 
    isLeaving,
    isProjectMember 
  } = useProjectMembers(projectId);
  const { entries } = useTimeTracking();
  const { getRateForUser, calculateEarnings } = useTeamMemberRates();

  const isMember = isProjectMember(projectId);

  // Calculate time per member for this project
  const memberTimeMap = new Map<string, number>();
  entries
    .filter((e) => e.project_id === projectId && e.duration_minutes)
    .forEach((e) => {
      const current = memberTimeMap.get(e.user_id) || 0;
      memberTimeMap.set(e.user_id, current + (e.duration_minutes || 0));
    });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
          <div className="flex justify-end">
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
                Opuść projekt
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => joinProject(projectId)}
                disabled={isJoining}
              >
                {isJoining ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Dołącz do projektu
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
            <div className="space-y-3">
              {members.map((member) => {
                const totalMinutes = memberTimeMap.get(member.user_id) || 0;
                const earnings = calculateEarnings(member.user_id, totalMinutes);
                const rate = getRateForUser(member.user_id);

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(member.user_id.slice(0, 8))}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {member.user_id.slice(0, 8)}...
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
