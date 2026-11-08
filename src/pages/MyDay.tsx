import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ExternalLink, Phone, RefreshCw, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Lead, Deal } from "@/hooks/useCRM";
import NextStepBadge from "@/components/crm/NextStepBadge";
import LeadDialog from "@/components/crm/LeadDialog";
import DealDialog from "@/components/crm/DealDialog";
import RecordContactDialog, { type ContactTarget } from "@/components/crm/RecordContactDialog";
import { addWorkingDays, calendarDate, isContactTime, isWorkingDay, nextWorkingDay, warsawToday, CONTACT_PROMISE } from "@/lib/workingDays";
import { GROWTH_SOURCES } from "@/lib/growthSources";

type OwnerFilter = "mine" | "all" | "unassigned";
type DayRow = ContactTarget & { company: string | null; phone: string | null; source: string; status: string; next_step: string | null; next_step_date: string | null; assigned_to: string | null; created_at: string };

export default function MyDay() {
  const { user, role } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [owner, setOwner] = useState<OwnerFilter>("mine");
  const [clock, setClock] = useState(() => new Date());
  const [guideClosed, setGuideClosed] = useState(false);
  const [contact, setContact] = useState<ContactTarget | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const guideKey = `crm-guide-closed:${user?.id ?? ""}`;
  useEffect(() => { setGuideClosed(localStorage.getItem(guideKey) === "true"); }, [guideKey]);
  useEffect(() => { const timer = setInterval(() => setClock(new Date()), 60_000); return () => clearInterval(timer); }, []);
  const today = warsawToday(clock);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["my-day", user?.id], enabled: Boolean(user), refetchInterval: 60_000,
    queryFn: async () => {
      const [leadResult, dealResult] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("deals").select("*, lead:leads(*)").order("created_at", { ascending: false }),
      ]);
      if (leadResult.error) throw leadResult.error;
      if (dealResult.error) throw dealResult.error;
      return { leads: leadResult.data as Lead[], deals: dealResult.data as Deal[] };
    },
  });
  const postpone = useMutation({
    mutationFn: async (row: DayRow) => {
      const base = row.next_step_date && calendarDate(row.next_step_date) > today ? calendarDate(row.next_step_date) : today;
      const { error } = await supabase.from(row.kind === "lead" ? "leads" : "deals").update({ next_step_date: nextWorkingDay(base) }).eq("id", row.id).select("id").single();
      if (error) throw error;
    },
    onSuccess: () => { for (const key of ["my-day", "leads", "deals"]) queryClient.invalidateQueries({ queryKey: [key] }); toast({ title: "Termin przełożony na następny dzień roboczy" }); },
    onError: (error: Error) => toast({ title: "Nie przełożono terminu", description: error.message, variant: "destructive" }),
  });
  const leads = data?.leads ?? [];
  const deals = data?.deals ?? [];
  const leadRows: DayRow[] = leads.map((lead) => ({ ...lead, kind: "lead" }));
  const dealRows: DayRow[] = deals.map((item) => ({
    id: item.id, kind: "deal", name: item.title, company: item.lead?.company ?? null, phone: item.lead?.phone ?? null,
    source: item.lead?.source_channel ?? item.lead?.source ?? "manual", status: item.stage,
    next_step: item.next_step, next_step_date: item.next_step_date, assigned_to: item.assigned_to, created_at: item.created_at,
  }));
  const rows = [...leadRows, ...dealRows].filter((row) => {
    if (row.status === "lost" || (row.kind === "deal" && row.status === "won")) return false;
    if (owner === "all") return true;
    if (owner === "unassigned") return !row.assigned_to;
    return row.assigned_to === user?.id || (role === "admin" && row.kind === "lead" && !row.assigned_to);
  });
  const rowDate = (row: DayRow) => row.next_step_date ? calendarDate(row.next_step_date) : "";
  const byDate = (a: DayRow, b: DayRow) => rowDate(a).localeCompare(rowDate(b));
  const newRows = rows.filter((row) => row.kind === "lead" && row.status === "new").sort((a, b) => b.created_at.localeCompare(a.created_at));
  const overdue = rows.filter((row) => rowDate(row) && rowDate(row) < today).sort(byDate);
  const due = rows.filter((row) => rowDate(row) === today);
  const end = addWorkingDays(today, 5);
  const sections = [
    { title: "Nowe leady do telefonu", rows: newRows },
    { title: "Zaległe", rows: overdue },
    { title: "Na dziś", rows: due },
    { title: "Oferty do follow-upu", rows: rows.filter((row) => row.status === "proposal").sort(byDate) },
    { title: "Najbliższe 5 dni roboczych", rows: rows.filter((row) => rowDate(row) > today && rowDate(row) <= end && isWorkingDay(rowDate(row))).sort(byDate) },
    { title: "Bez następnego kroku", rows: rows.filter((row) => row.kind === "lead" && !row.next_step_date) },
  ];
  const sourceName = (source: string) => source.includes("meta") ? "Formularz Meta" : source === "website" ? "WWW" : GROWTH_SOURCES.find((s) => s.value === source)?.label ?? source;
  return <DashboardLayout title="Mój dzień" mobileFriendly>
    <Helmet><title>Mój dzień | FOTZ Studio</title><meta name="description" content="Codzienna lista kontaktów i następnych kroków CRM." /></Helmet>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Mój dzień</h1><p className="mt-1 text-muted-foreground">Dziś: {due.length}, zaległe: {overdue.length}, nowe: {newRows.length}</p><p className="text-sm text-muted-foreground">{today.split("-").reverse().join(".")}, Europe/Warsaw</p></div>
        <div className="flex items-center gap-2">
          {(role === "admin" || role === "manager") && <Select value={owner} onValueChange={(value) => setOwner(value as OwnerFilter)}><SelectTrigger aria-label="Filtr opiekuna" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mine">Moje</SelectItem><SelectItem value="all">Wszystkie</SelectItem><SelectItem value="unassigned">Nieprzypisane</SelectItem></SelectContent></Select>}
          <Button variant="outline" size="icon" aria-label="Odśwież listę" title="Odśwież listę" disabled={isFetching} onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>
      {!isContactTime(clock) && <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">Poza godzinami kontaktu. {CONTACT_PROMISE}</p>}
      {!guideClosed ? <section className="border-y border-border py-4">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Jak pracować z CRM</h2><Button size="icon" variant="ghost" aria-label="Zamknij instrukcję" onClick={() => { localStorage.setItem(guideKey, "true"); setGuideClosed(true); }}><X className="h-4 w-4" /></Button></div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Dzień zaczynasz od „Mój dzień”.</li><li>Nowy lead: telefon od razu w godzinach pracy, cel rozmowy to spotkanie w ciągu 2 dni roboczych.</li><li>Po każdym kontakcie „Zapisz kontakt” i następny krok.</li><li>Po wysłaniu oferty jeden follow-up po 5 dniach roboczych.</li><li>W weekendy i święta nie dzwonimy.</li>
        </ol>
      </section> : <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(guideKey); setGuideClosed(false); }}>Jak pracować z CRM</Button>}
      {isLoading ? <p role="status">Ładowanie kontaktów...</p> : isError ? <div role="alert" className="text-destructive">Nie udało się pobrać kontaktów. <Button variant="outline" onClick={() => refetch()}>Spróbuj ponownie</Button></div> : sections.map((section) => <section key={section.title} className="space-y-3">
        <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{section.title}</h2><Badge variant="secondary">{section.rows.length}</Badge></div>
        {section.rows.length === 0 ? <p className="border-t border-border py-4 text-sm text-muted-foreground">Brak rekordów</p> : <div className="divide-y divide-border border-y border-border">{section.rows.map((row) => <article key={`${row.kind}:${row.id}`} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0 space-y-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-medium">{row.name}</h3><Badge variant="outline">{row.kind === "lead" ? "Lead" : "Deal"}</Badge></div><p className="break-words text-sm text-muted-foreground">{row.company || "Brak firmy"}, {sourceName(row.source)}</p>{row.phone ? <a className="inline-flex items-center gap-1 text-sm text-primary" href={`tel:${row.phone.replace(/[^+\d]/g, "")}`}><Phone className="h-3 w-3" />{row.phone}</a> : <p className="text-sm text-muted-foreground">Brak telefonu</p>}</div>
          <div className="min-w-0 space-y-1"><p className="break-words text-sm">{row.next_step || "Brak następnego kroku"}</p>{row.next_step_date ? <NextStepBadge date={row.next_step_date} /> : <span className="text-sm text-muted-foreground">Brak daty</span>}</div>
          <div className="flex flex-wrap items-center gap-2 lg:max-w-64"><Button size="sm" onClick={() => setContact(row)}>Zapisz kontakt</Button><Button variant="outline" size="icon" title="Przełóż na następny dzień roboczy" aria-label={`Przełóż na następny dzień roboczy: ${row.name}`} disabled={postpone.isPending} onClick={() => postpone.mutate(row)}><CalendarDays className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => { if (row.kind === "lead") setLeadId(row.id); else setDeal(deals.find((d) => d.id === row.id) ?? null); }}><ExternalLink className="mr-1 h-3 w-3" />Otwórz</Button></div>
        </article>)}</div>}
      </section>)}
    </div>
    <RecordContactDialog target={contact} onClose={() => setContact(null)} />
    <LeadDialog open={Boolean(leadId)} leadId={leadId} onOpenChange={(open) => { if (!open) { setLeadId(null); queryClient.invalidateQueries({ queryKey: ["my-day"] }); } }} onClose={() => setLeadId(null)} />
    <DealDialog open={Boolean(deal)} deal={deal} leads={leads} onOpenChange={(open) => { if (!open) { setDeal(null); queryClient.invalidateQueries({ queryKey: ["my-day"] }); } }} />
  </DashboardLayout>;
}