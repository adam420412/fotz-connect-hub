import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInvitations } from "@/hooks/useInvitations";
import { useToast } from "@/hooks/use-toast";
import { Mail, Copy, Trash2, UserPlus, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const Invitations = () => {
  const { toast } = useToast();
  const { invitations, isLoading, createInvitation, deleteInvitation } = useInvitations();
  
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    role: "client" as "admin" | "manager" | "employee" | "client",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.companyName) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive",
      });
      return;
    }

    await createInvitation.mutateAsync(formData);
    setFormData({ email: "", companyName: "", role: "client" });
  };

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/auth?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Skopiowano",
      description: "Link rejestracyjny został skopiowany do schowka",
    });
  };

  const getStatusBadge = (invitation: any) => {
    if (invitation.used_at) {
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Wykorzystane
        </Badge>
      );
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return (
        <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Wygasłe
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
        <Clock className="h-3 w-3 mr-1" />
        Oczekuje
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      manager: "Menedżer",
      employee: "Pracownik",
      client: "Klient",
    };

    const roleColors: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      employee: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      client: "bg-primary/10 text-primary border-primary/20",
    };

    return (
      <Badge variant="outline" className={roleColors[role]}>
        {roleLabels[role]}
      </Badge>
    );
  };

  const pendingInvitations = invitations.filter(
    (inv) => !inv.used_at && new Date(inv.expires_at) >= new Date()
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Zaproszenia</h1>
          <p className="text-muted-foreground">
            Zarządzaj zaproszeniami dla nowych klientów i członków zespołu
          </p>
        </div>

        {/* Create invitation form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Nowe zaproszenie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@firma.pl"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nazwa firmy</Label>
                  <Input
                    id="companyName"
                    placeholder="Nazwa firmy klienta"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rola</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "admin" | "manager" | "employee" | "client") =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Klient</SelectItem>
                      <SelectItem value="employee">Pracownik</SelectItem>
                      <SelectItem value="manager">Menedżer</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={createInvitation.isPending}>
                <Mail className="h-4 w-4 mr-2" />
                {createInvitation.isPending ? "Wysyłanie..." : "Wyślij zaproszenie"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invitations list */}
        <Card>
          <CardHeader>
            <CardTitle>
              Historia zaproszeń
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingInvitations.length} oczekujących
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Ładowanie...
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak zaproszeń
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead>Wygasa</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => {
                    const isActive = !invitation.used_at && new Date(invitation.expires_at) >= new Date();
                    
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          {invitation.email}
                        </TableCell>
                        <TableCell>{invitation.company_name || "-"}</TableCell>
                        <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                        <TableCell>{getStatusBadge(invitation)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invitation.created_at), "dd MMM yyyy", { locale: pl })}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(invitation.expires_at), "dd MMM yyyy", { locale: pl })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyInvitationLink(invitation.token)}
                                title="Kopiuj link"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteInvitation.mutate(invitation.id)}
                              className="text-destructive hover:text-destructive"
                              title="Usuń"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Invitations;
