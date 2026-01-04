import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, MessageSquare, Calendar, FileText } from "lucide-react";
import { ContactHistory, Lead } from "@/hooks/useCRM";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface ContactHistoryListProps {
  history: ContactHistory[];
  leads: Lead[];
  isLoading: boolean;
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  call: { label: "Rozmowa", icon: Phone, color: "text-blue-500" },
  email: { label: "Email", icon: Mail, color: "text-green-500" },
  meeting: { label: "Spotkanie", icon: Calendar, color: "text-purple-500" },
  note: { label: "Notatka", icon: FileText, color: "text-gray-500" },
  booking: { label: "Rezerwacja", icon: Calendar, color: "text-orange-500" },
};

const ContactHistoryList = ({ history, leads, isLoading }: ContactHistoryListProps) => {
  const getLeadName = (leadId: string | null) => {
    if (!leadId) return "Nieznany";
    const lead = leads.find((l) => l.id === leadId);
    return lead?.name || "Nieznany";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak historii kontaktów.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => {
        const config = typeConfig[entry.contact_type] || typeConfig.note;
        const Icon = config.icon;

        return (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full bg-muted ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{config.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {getLeadName(entry.lead_id)}
                    </span>
                  </div>
                  {entry.subject && (
                    <h4 className="font-medium mb-1">{entry.subject}</h4>
                  )}
                  <p className="text-sm text-muted-foreground">{entry.content}</p>
                </div>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(entry.contact_date), "d MMM yyyy, HH:mm", { locale: pl })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ContactHistoryList;
