import { MessageSquare, FileCheck, CheckCircle2, Upload, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "comment" | "file_approved" | "task_completed" | "file_uploaded" | "user_added";
  title: string;
  description: string;
  time: string;
  user: {
    name: string;
    avatar?: string;
  };
}

const activityIcons = {
  comment: MessageSquare,
  file_approved: FileCheck,
  task_completed: CheckCircle2,
  file_uploaded: Upload,
  user_added: UserPlus,
};

const activityColors = {
  comment: "bg-blue-500/10 text-blue-500",
  file_approved: "bg-emerald-500/10 text-emerald-500",
  task_completed: "bg-primary/10 text-primary",
  file_uploaded: "bg-violet-500/10 text-violet-500",
  user_added: "bg-cyan-500/10 text-cyan-500",
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold">Ostatnia aktywność</h3>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.type];
          const colorClass = activityColors[activity.type];

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50"
            >
              <div className={cn("rounded-lg p-2", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-tight">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{activity.user.name}</span>
                  <span>•</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
