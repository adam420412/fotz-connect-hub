import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkingDateInput from "./WorkingDateInput";
import { contactNextStep, contactResults, type ContactResult } from "@/lib/crmContact";

export interface ContactTarget { id: string; kind: "lead" | "deal"; name: string }

export default function RecordContactDialog({ target, onClose }: { target: ContactTarget | null; onClose: () => void }) {
  const [type, setType] = useState("call");
  const [result, setResult] = useState<ContactResult>("no_answer");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useEffect(() => { setType("call"); setResult("no_answer"); setNote(""); setDate(""); }, [target]);
  const save = useMutation({
    mutationFn: async () => {
      if (!target) throw new Error("Wybierz rekord.");
      const next = contactNextStep(result, date);
      const { error } = await supabase.rpc("record_crm_contact", {
        p_entity_type: target.kind, p_entity_id: target.id, p_contact_type: type,
        p_result: result, p_note: note, p_next_step: next.next_step, p_next_date: next.next_step_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      for (const key of ["leads", "deals", "contact_history", "my-day"]) queryClient.invalidateQueries({ queryKey: [key] });
      toast({ title: "Kontakt i następny krok zapisane" });
      onClose();
    },
    onError: (error: Error) => toast({ title: "Nie zapisano kontaktu", description: error.message, variant: "destructive" }),
  });
  return <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open && !save.isPending) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Zapisz kontakt, {target?.name}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        <div className="space-y-2"><Label>Rodzaj kontaktu</Label>
          <Select value={type} onValueChange={setType}><SelectTrigger aria-label="Rodzaj kontaktu"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="call">Telefon</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="meeting">Spotkanie</SelectItem>
          </SelectContent></Select>
        </div>
        <div className="space-y-2"><Label>Wynik</Label>
          <Select value={result} onValueChange={(value) => setResult(value as ContactResult)}><SelectTrigger aria-label="Wynik kontaktu"><SelectValue /></SelectTrigger><SelectContent>
            {Object.entries(contactResults).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent></Select>
        </div>
        {(result === "meeting" || result === "callback") && <div className="space-y-2"><Label htmlFor="contact-date">Data {result === "meeting" ? "spotkania" : "oddzwonienia"}</Label><WorkingDateInput id="contact-date" value={date} onChange={setDate} required /></div>}
        <div className="space-y-2"><Label htmlFor="contact-note">Notatka</Label><Textarea id="contact-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={8000} rows={3} /></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>Anuluj</Button><Button type="submit" disabled={save.isPending}>{save.isPending ? "Zapisywanie..." : "Zapisz kontakt"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}