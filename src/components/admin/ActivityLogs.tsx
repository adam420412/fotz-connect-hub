import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Activity, User, FileText, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

interface ActivityLogsProps {
  logs: ActivityLog[];
}

const actionTypeConfig: Record<string, { label: string; color: string }> = {
  role_change: { label: "Zmiana roli", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  user_activated: { label: "Aktywacja", color: "bg-green-500/10 text-green-600 border-green-200" },
  user_deactivated: { label: "Dezaktywacja", color: "bg-red-500/10 text-red-600 border-red-200" },
  team_member_assigned: { label: "Przypisanie opiekuna", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  login: { label: "Logowanie", color: "bg-gray-500/10 text-gray-600 border-gray-200" },
  file_upload: { label: "Upload pliku", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  file_status_change: { label: "Zmiana statusu pliku", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
};

const entityTypeConfig: Record<string, { icon: React.ReactNode }> = {
  user: { icon: <User className="h-4 w-4" /> },
  client: { icon: <User className="h-4 w-4" /> },
  file: { icon: <FileText className="h-4 w-4" /> },
  role: { icon: <Shield className="h-4 w-4" /> },
};

export function ActivityLogs({ logs }: ActivityLogsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionConfig = (actionType: string) => {
    return actionTypeConfig[actionType] || { label: actionType, color: "bg-gray-500/10 text-gray-600 border-gray-200" };
  };

  const getEntityIcon = (entityType: string) => {
    return entityTypeConfig[entityType]?.icon || <Activity className="h-4 w-4" />;
  };

  const formatDetails = (details: Record<string, any> | null): string => {
    if (!details) return "-";
    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po użytkowniku lub akcji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Typ akcji" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie akcje</SelectItem>
            {Object.entries(actionTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Data i godzina</TableHead>
              <TableHead>Użytkownik</TableHead>
              <TableHead>Akcja</TableHead>
              <TableHead>Obiekt</TableHead>
              <TableHead>Szczegóły</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Brak logów aktywności</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const actionConfig = getActionConfig(log.action_type);
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          {format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.user_email || "System"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={actionConfig.color}>
                        {actionConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entity_type)}
                        <span className="text-sm text-muted-foreground">
                          {log.entity_name || log.entity_id || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDetails(log.details)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
