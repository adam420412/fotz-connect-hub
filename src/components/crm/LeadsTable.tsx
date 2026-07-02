import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, Building, MoreHorizontal } from "lucide-react";
import { Lead } from "@/hooks/useCRM";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCRM } from "@/hooks/useCRM";
import NextStepBadge from "./NextStepBadge";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onSelectLead: (id: string) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Nowy", className: "bg-blue-500 hover:bg-blue-500 text-white border-transparent" },
  contacted: { label: "Po kontakcie", className: "bg-yellow-500 hover:bg-yellow-500 text-white border-transparent" },
  qualified: { label: "Kwalifikowany", className: "bg-green-500 hover:bg-green-500 text-white border-transparent" },
  nurture: { label: "Nurture", className: "bg-purple-500 hover:bg-purple-500 text-white border-transparent" },
  lost: { label: "Przegrany", className: "bg-gray-500 hover:bg-gray-500 text-white border-transparent" },
};

const LeadsTable = ({ leads, isLoading, onSelectLead }: LeadsTableProps) => {
  const { updateLead, deleteLead } = useCRM();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak leadów. Dodaj pierwszy lead lub poczekaj na formularze z fotz.pl.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nazwa</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Firma</TableHead>
            <TableHead>Źródło</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow 
              key={lead.id} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectLead(lead.id)}
            >
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" />
                    {lead.email}
                  </span>
                  {lead.phone && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {lead.company && (
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {lead.company}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{lead.source}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusConfig[lead.status]?.className || "bg-gray-500 text-white border-transparent"}>
                  {statusConfig[lead.status]?.label || lead.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(lead.created_at), "d MMM yyyy", { locale: pl })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      updateLead.mutate({ id: lead.id, status: "contacted" });
                    }}>
                      Oznacz jako kontaktowany
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      updateLead.mutate({ id: lead.id, status: "qualified" });
                    }}>
                      Oznacz jako kwalifikowany
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLead.mutate(lead.id);
                      }}
                    >
                      Usuń lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsTable;
