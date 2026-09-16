import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Globe2,
  Linkedin,
  Megaphone,
  MessageCircle,
  RadioTower,
  Users,
  Video,
  Workflow,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCRM } from "@/hooks/useCRM";
import { useGrowthOS } from "@/hooks/useGrowthOS";
import { useScheduledPosts } from "@/hooks/useScheduledPosts";
import { GROWTH_SOURCE_LABELS, normalizeLegacySource } from "@/lib/growthSources";

const formatPLN = (value: number) => new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
}).format(value);

const sourceForLead = (lead: { source: string; source_channel?: string }) =>
  lead.source_channel || normalizeLegacySource(lead.source);

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Aktywne", className: "bg-emerald-600 text-white" },
  ready: { label: "Gotowe do testu", className: "bg-blue-600 text-white" },
  setup_required: { label: "Do podłączenia", className: "bg-amber-500 text-white" },
  paused: { label: "Wstrzymane", className: "bg-slate-500 text-white" },
  error: { label: "Błąd", className: "bg-red-600 text-white" },
};

const flowCards = [
  {
    title: "Strona i formularze",
    description: "Formularz → trwała kolejka → Connect Hub → follow-up.",
    icon: Globe2,
    href: "https://fotz-studio-web-experience.lovable.app/",
    external: true,
  },
  {
    title: "Instagram i ManyChat",
    description: "Słowo CONTENT → pytania kwalifikujące → lead i touchpoint.",
    icon: MessageCircle,
    href: "/crm",
  },
  {
    title: "LinkedIn i Kanbox",
    description: "Odpowiedź → kwalifikacja → profil LinkedIn bez sztucznego emaila.",
    icon: Linkedin,
    href: "/crm",
  },
  {
    title: "YouTube i shorty",
    description: "Jeden materiał źródłowy → YT, IG, FB, LinkedIn → wspólne UTM.",
    icon: Video,
    href: "/post-schedule",
  },
];

export default function GrowthOS() {
  const { leads, deals, bookings } = useCRM();
  const { posts } = useScheduledPosts("agency");
  const { integrations, campaigns, touchpoints, schemaReady, error } = useGrowthOS();

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentLeads = leads.filter((lead) => new Date(lead.created_at).getTime() >= since);
  const qualified = recentLeads.filter((lead) => lead.status === "qualified").length;
  const wonDeals = deals.filter((deal) => deal.stage === "won");
  const wonValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const published = posts.filter((post) => post.status === "published").length;

  const channels = Array.from(new Set([
    ...leads.map(sourceForLead),
    ...integrations.map((integration) => integration.channel),
  ])).filter(Boolean).map((channel) => {
    const channelLeads = leads.filter((lead) => sourceForLead(lead) === channel);
    const leadIds = new Set(channelLeads.map((lead) => lead.id));
    const channelDeals = deals.filter((deal) => deal.lead_id && leadIds.has(deal.lead_id));
    const won = channelDeals.filter((deal) => deal.stage === "won");
    return {
      channel,
      leads: channelLeads.length,
      qualified: channelLeads.filter((lead) => lead.status === "qualified").length,
      calls: bookings.filter((booking) => booking.lead_id && leadIds.has(booking.lead_id)).length,
      won: won.length,
      revenue: won.reduce((sum, deal) => sum + (deal.value || 0), 0),
    };
  }).sort((a, b) => b.leads - a.leads);

  const funnelRate = leads.length ? Math.round((wonDeals.length / leads.length) * 1000) / 10 : 0;
  const readiness = integrations.length
    ? Math.round((integrations.filter((item) => item.status === "active" || item.status === "ready").length / integrations.length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <Helmet>
        <title>Growth OS | FOTZ Studio</title>
        <meta name="description" content="Kanały, kampanie, content i sprzedaż FOTZ w jednym systemie" />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <Workflow className="h-4 w-4" />
              Własny system FOTZ
            </div>
            <h1 className="text-3xl font-bold">FOTZ Growth OS</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">
              Jeden rekord klienta od pierwszego filmu lub wiadomości aż do rozmowy, oferty, projektu i przychodu.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/post-schedule">Plan treści</Link>
            </Button>
            <Button asChild>
              <Link to="/crm">Otwórz pipeline <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {!schemaReady && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Schemat Growth OS czeka na wdrożenie</AlertTitle>
            <AlertDescription>
              Najpierw uruchom migrację bazy i zabezpieczony webhook. Panel nie udaje danych, których jeszcze nie ma.
              {error instanceof Error ? ` (${error.message})` : ""}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Leady / 30 dni", value: recentLeads.length, icon: Users, hint: "wszystkie kanały" },
            { label: "Kwalifikowane", value: qualified, icon: RadioTower, hint: "gotowe do rozmowy" },
            { label: "Rezerwacje", value: bookings.length, icon: CalendarCheck, hint: "terminy w CRM" },
            { label: "Wygrana wartość", value: formatPLN(wonValue), icon: BadgeDollarSign, hint: `${funnelRate}% lead → klient` },
            { label: "Opublikowane", value: published, icon: Megaphone, hint: "pozycje w harmonogramie" },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flowCards.map((flow) => (
            <Card key={flow.title} className="group">
              <CardContent className="flex h-full flex-col pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <flow.icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold">{flow.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{flow.description}</p>
                {flow.external ? (
                  <a href={flow.href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Otwórz <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <Link to={flow.href} className="mt-4 inline-flex items-center text-sm font-medium text-primary">
                    Przejdź <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Wynik według kanału</CardTitle>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Pierwsze wyniki pojawią się po teście formularza i importu.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kanał</TableHead>
                      <TableHead className="text-right">Leady</TableHead>
                      <TableHead className="text-right">Kwal.</TableHead>
                      <TableHead className="text-right">Rozmowy</TableHead>
                      <TableHead className="text-right">Wygrane</TableHead>
                      <TableHead className="text-right">Wartość</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((row) => (
                      <TableRow key={row.channel}>
                        <TableCell className="font-medium">{GROWTH_SOURCE_LABELS[row.channel] || row.channel}</TableCell>
                        <TableCell className="text-right">{row.leads}</TableCell>
                        <TableCell className="text-right">{row.qualified}</TableCell>
                        <TableCell className="text-right">{row.calls}</TableCell>
                        <TableCell className="text-right">{row.won}</TableCell>
                        <TableCell className="text-right">{formatPLN(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gotowość integracji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{readiness}% systemu gotowe do testu</span>
                  <span className="text-muted-foreground">{touchpoints.length} touchpointów</span>
                </div>
                <Progress value={readiness} />
              </div>
              <div className="space-y-3">
                {integrations.map((integration) => {
                  const config = statusConfig[integration.status] || statusConfig.setup_required;
                  return (
                    <div key={integration.provider} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 font-medium">
                          {integration.status === "active" || integration.status === "ready"
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <CircleDashed className="h-4 w-4 text-amber-500" />}
                          {integration.display_name}
                        </div>
                        <Badge className={config.className}>{config.label}</Badge>
                      </div>
                      {integration.setup_note && <p className="mt-2 text-xs text-muted-foreground">{integration.setup_note}</p>}
                      {integration.last_event_at && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Ostatnie zdarzenie: {new Date(integration.last_event_at).toLocaleString("pl-PL")}
                        </p>
                      )}
                    </div>
                  );
                })}
                {integrations.length === 0 && <p className="text-sm text-muted-foreground">Źródła pojawią się po migracji.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kampanie i oferta 3–5 tys. PLN</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Startowa kampania zostanie utworzona przez migrację Growth OS.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-primary">{campaign.code}</p>
                        <h3 className="mt-1 font-semibold">{campaign.name}</h3>
                      </div>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{campaign.objective}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      {campaign.offer_value != null && <Badge>{formatPLN(campaign.offer_value)}</Badge>}
                      {campaign.utm_campaign && <Badge variant="secondary">utm: {campaign.utm_campaign}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
