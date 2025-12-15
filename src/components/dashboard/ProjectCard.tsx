import { Link } from "react-router-dom";
import { Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  dueDate?: string;
  status: "active" | "paused" | "completed";
  team?: { name: string; avatar?: string }[];
}

const statusConfig = {
  active: {
    label: "Aktywny",
    className: "bg-emerald-500/10 text-emerald-500",
  },
  paused: {
    label: "Wstrzymany",
    className: "bg-amber-500/10 text-amber-500",
  },
  completed: {
    label: "Zakończony",
    className: "bg-primary/10 text-primary",
  },
};

const ProjectCard = ({
  id,
  name,
  description,
  progress,
  tasksCompleted,
  totalTasks,
  dueDate,
  status,
  team,
}: ProjectCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <Link
      to={`/projects/${id}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
            {name}
          </h3>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            statusInfo.className
          )}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Postęp</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            {tasksCompleted}/{totalTasks} zadań
          </span>
        </div>
        {dueDate && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{dueDate}</span>
          </div>
        )}
      </div>

      {/* Team avatars */}
      {team && team.length > 0 && (
        <div className="mt-4 flex items-center -space-x-2">
          {team.slice(0, 4).map((member, i) => (
            <div
              key={i}
              className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-medium text-primary"
            >
              {member.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          ))}
          {team.length > 4 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
              +{team.length - 4}
            </div>
          )}
        </div>
      )}
    </Link>
  );
};

export default ProjectCard;
