import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  History,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  Clock
} from "lucide-react";
import { useCRM } from "@/hooks/useCRM";
import LeadsTable from "@/components/crm/LeadsTable";
import DealsKanban from "@/components/crm/DealsKanban";
import BookingsTable from "@/components/crm/BookingsTable";
import ContactHistoryList from "@/components/crm/ContactHistoryList";
import LeadDialog from "@/components/crm/LeadDialog";
import DealDialog from "@/components/crm/DealDialog";

const CRM = () => {
  const { leads, deals, bookings, contactHistory, stats, isLoading } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
    }).format(value);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>CRM | FOTZ Studio</title>
        <meta name="description" content="Zarządzanie relacjami z klientami" />
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">Zarządzanie leadami i sprzedażą</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowLeadDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowy lead
            </Button>
            <Button variant="outline" onClick={() => setShowDealDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nowy deal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leady</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newLeads} nowych
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deale</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.dealsValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rezerwacje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                oczekujących
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Potwierdzone</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
              <p className="text-xs text-muted-foreground">
                rezerwacji
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj leadów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leady
              <Badge variant="secondary" className="ml-1">{leads.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pipeline
              <Badge variant="secondary" className="ml-1">{deals.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rezerwacje
              <Badge variant="secondary" className="ml-1">{bookings.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <LeadsTable 
              leads={filteredLeads} 
              isLoading={isLoading}
              onSelectLead={(id) => {
                setSelectedLeadId(id);
                setShowLeadDialog(true);
              }}
            />
          </TabsContent>

          <TabsContent value="deals" className="space-y-4">
            <DealsKanban deals={deals} leads={leads} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <BookingsTable bookings={bookings} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ContactHistoryList 
              history={contactHistory} 
              leads={leads}
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </div>

      <LeadDialog 
        open={showLeadDialog} 
        onOpenChange={setShowLeadDialog}
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />

      <DealDialog 
        open={showDealDialog} 
        onOpenChange={setShowDealDialog}
        leads={leads}
      />
    </DashboardLayout>
  );
};

export default CRM;
