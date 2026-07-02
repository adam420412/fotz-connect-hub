import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar } from "lucide-react";

export type NextStepStatus = "overdue" | "today" | "upcoming" | "none";

export const getNextStepStatus = (date: string | null | undefined): NextStepStatus => {
  if (!date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return "today";
  if (d.getTime() < today.getTime()) return "overdue";
  return "upcoming";
};

interface NextStepBadgeProps {
  date: string | null | undefined;
  compact?: boolean;
}

const NextStepBadge = ({ date, compact }: NextStepBadgeProps) => {
  if (!date) return null;
  const status = getNextStepStatus(date);
  const formatted = format(new Date(date), "d MMM", { locale: pl });

  if (status === "today") {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-500 text-white border-transparent gap-1">
        <Calendar className="h-3 w-3" />
        {compact ? "DZIŚ" : `DZIŚ · ${formatted}`}
      </Badge>
    );
  }
  if (status === "overdue") {
    return (
      <Badge className="bg-red-500 hover:bg-red-500 text-white border-transparent gap-1">
        <Calendar className="h-3 w-3" />
        {compact ? "ZALEGŁE" : `ZALEGŁE · ${formatted}`}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Calendar className="h-3 w-3" />
      {formatted}
    </Badge>
  );
};

export default NextStepBadge;
