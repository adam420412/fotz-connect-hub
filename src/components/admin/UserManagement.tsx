import { useState } from "react";
import { AppRole } from "@/hooks/useAuth";
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
import { Input } from "@/components/ui/input";
import { UserCheck, UserX, Search, Shield, User, Briefcase, Users } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  is_active: boolean;
  role: AppRole | null;
  created_at: string;
}

interface UserManagementProps {
  users: UserWithRole[];
  onUpdateRole: (userId: string, role: AppRole) => Promise<boolean>;
  onToggleActive: (userId: string, isActive: boolean) => Promise<boolean>;
}

const roleConfig: Record<AppRole, { label: string; icon: React.ReactNode; color: string }> = {
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, color: "bg-red-500/10 text-red-600 border-red-200" },
  manager: { label: "Manager", icon: <Briefcase className="h-3 w-3" />, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  employee: { label: "Pracownik", icon: <Users className="h-3 w-3" />, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  client: { label: "Klient", icon: <User className="h-3 w-3" />, color: "bg-green-500/10 text-green-600 border-green-200" },
};

export function UserManagement({ users, onUpdateRole, onToggleActive }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    action: "activate" | "deactivate";
  } | null>(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    await onUpdateRole(userId, newRole as AppRole);
  };

  const handleToggleActive = async () => {
    if (!confirmDialog) return;
    await onToggleActive(confirmDialog.userId, confirmDialog.action === "activate");
    setConfirmDialog(null);
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtruj po roli" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie role</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="employee">Pracownik</SelectItem>
            <SelectItem value="client">Klient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Użytkownik</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Rola</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data rejestracji</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nie znaleziono użytkowników
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.full_name || "Brak nazwy"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.company_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role || "client"}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).map(([role, config]) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              {config.icon}
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.is_active
                          ? "bg-green-500/10 text-green-600 border-green-200"
                          : "bg-red-500/10 text-red-600 border-red-200"
                      }
                    >
                      {user.is_active ? "Aktywny" : "Nieaktywny"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), "d MMM yyyy", { locale: pl })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirmDialog({
                          isOpen: true,
                          userId: user.id,
                          action: user.is_active ? "deactivate" : "activate",
                        })
                      }
                    >
                      {user.is_active ? (
                        <UserX className="h-4 w-4 text-destructive" />
                      ) : (
                        <UserCheck className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
              {confirmDialog?.action === "deactivate"
                ? "Dezaktywować użytkownika?"
                : "Aktywować użytkownika?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === "deactivate"
                ? "Użytkownik nie będzie mógł się zalogować do systemu."
                : "Użytkownik będzie mógł ponownie korzystać z systemu."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive}>
              {confirmDialog?.action === "deactivate" ? "Dezaktywuj" : "Aktywuj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
