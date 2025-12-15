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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Building2, UserCircle, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Client {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  is_active: boolean;
  created_at: string;
  assigned_team_member_id: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ClientManagementProps {
  clients: Client[];
  teamMembers: TeamMember[];
  onAssignTeamMember: (clientId: string, teamMemberId: string | null) => Promise<boolean>;
  onToggleArchive: (clientId: string, isActive: boolean) => Promise<boolean>;
}

export function ClientManagement({
  clients,
  teamMembers,
  onAssignTeamMember,
  onToggleArchive,
}: ClientManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    clientId: string;
    action: "archive" | "restore";
  } | null>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && client.is_active) ||
      (statusFilter === "archived" && !client.is_active);

    return matchesSearch && matchesStatus;
  });

  const handleAssignTeamMember = async (clientId: string, teamMemberId: string) => {
    await onAssignTeamMember(clientId, teamMemberId === "none" ? null : teamMemberId);
  };

  const handleToggleArchive = async () => {
    if (!confirmDialog) return;
    await onToggleArchive(confirmDialog.clientId, confirmDialog.action === "restore");
    setConfirmDialog(null);
  };

  const getAssignedTeamMember = (teamMemberId: string | null) => {
    if (!teamMemberId) return null;
    return teamMembers.find((tm) => tm.id === teamMemberId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po email, nazwie lub firmie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy</SelectItem>
            <SelectItem value="active">Aktywni</SelectItem>
            <SelectItem value="archived">Zarchiwizowani</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Klient</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Opiekun</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Od kiedy</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nie znaleziono klientów
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const assignedMember = getAssignedTeamMember(client.assigned_team_member_id);
                return (
                  <TableRow key={client.id} className={!client.is_active ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{client.full_name || "Brak nazwy"}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {client.company_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={client.assigned_team_member_id || "none"}
                        onValueChange={(value) => handleAssignTeamMember(client.id, value)}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Przypisz opiekuna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Brak opiekuna</SelectItem>
                          {teamMembers.map((tm) => (
                            <SelectItem key={tm.id} value={tm.id}>
                              {tm.name} ({tm.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          client.is_active
                            ? "bg-green-500/10 text-green-600 border-green-200"
                            : "bg-amber-500/10 text-amber-600 border-amber-200"
                        }
                      >
                        {client.is_active ? "Aktywny" : "Zarchiwizowany"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(client.created_at), "d MMM yyyy", { locale: pl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            clientId: client.id,
                            action: client.is_active ? "archive" : "restore",
                          })
                        }
                      >
                        {client.is_active ? (
                          <Archive className="h-4 w-4 text-amber-600" />
                        ) : (
                          <ArchiveRestore className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmDialog?.isOpen}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === "archive"
                ? "Zarchiwizować klienta?"
                : "Przywrócić klienta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "archive"
                ? "Klient zostanie oznaczony jako nieaktywny, ale jego dane pozostaną w systemie."
                : "Klient zostanie przywrócony do aktywnych."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleArchive}>
              {confirmDialog?.action === "archive" ? "Archiwizuj" : "Przywróć"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
