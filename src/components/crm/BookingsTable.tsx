import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Check, X } from "lucide-react";
import { Booking, useCRM } from "@/hooks/useCRM";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface BookingsTableProps {
  bookings: Booking[];
  isLoading: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Oczekująca", variant: "secondary" },
  confirmed: { label: "Potwierdzona", variant: "default" },
  cancelled: { label: "Anulowana", variant: "destructive" },
  completed: { label: "Zakończona", variant: "outline" },
};

const BookingsTable = ({ bookings, isLoading }: BookingsTableProps) => {
  const { updateBooking } = useCRM();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Brak rezerwacji. Poczekaj na formularze z fotz.pl.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klient</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Data i godzina</TableHead>
            <TableHead>Usługa</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Źródło</TableHead>
            <TableHead className="w-24">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.client_name}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-sm">
                  <span>{booking.client_email}</span>
                  {booking.client_phone && (
                    <span className="text-muted-foreground">{booking.client_phone}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(booking.booking_date), "d MMMM yyyy", { locale: pl })}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {booking.booking_time.slice(0, 5)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{booking.service_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[booking.status]?.variant || "secondary"}>
                  {statusConfig[booking.status]?.label || booking.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {booking.source}
              </TableCell>
              <TableCell>
                {booking.status === "pending" && (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={() => updateBooking.mutate({ id: booking.id, status: "confirmed" })}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                      onClick={() => updateBooking.mutate({ id: booking.id, status: "cancelled" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsTable;
