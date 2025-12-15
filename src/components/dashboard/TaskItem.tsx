import { cn } from "@/lib/utils";
import { Calendar, User, MessageSquare, Paperclip } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskItemProps {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignee?: string;
  comments?: number;
  attachments?: number;
  projectName?: string;
  onClick?: () => void;
}

const priorityConfig = {
  low: { label: "Niski", className: "bg-slate-500/10 text-slate-500" },
  medium: { label: "Średni", className: "bg-blue-500/10 text-blue-500" },
  high: { label: "Wysoki", className: "bg-amber-500/10 text-amber-500" },
  urgent: { label: "Pilne", className: "bg-destructive/10 text-destructive" },
};

const statusConfig = {
  todo: "Do zrobienia",
  in_progress: "W trakcie",
  review: "Do akceptacji",
  completed: "Zakończone",
};

const TaskItem = ({
  id,
  title,
  status,
  priority,
  dueDate,
  assignee,
  comments,
  attachments,
  projectName,
  onClick,
}: TaskItemProps) => {
  const priorityInfo = priorityConfig[priority];
  const isCompleted = status === "completed";

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md cursor-pointer",
        isCompleted && "opacity-60"
      )}
      onClick={onClick}
    >
      <Checkbox
        checked={isCompleted}
        className="mt-0.5 h-5 w-5 rounded-full"
      />

      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h4
              className={cn(
                "font-medium leading-tight transition-colors group-hover:text-primary",
                isCompleted && "line-through"
              )}
            >
              {title}
            </h4>
            {projectName && (
              <p className="text-xs text-muted-foreground">{projectName}</p>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              priorityInfo.className
            )}
          >
            {priorityInfo.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{dueDate}</span>
            </div>
          )}
          {assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{assignee}</span>
            </div>
          )}
          {comments && comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{comments}</span>
            </div>
          )}
          {attachments && attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{attachments}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
