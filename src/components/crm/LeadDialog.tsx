import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCRM, Lead } from "@/hooks/useCRM";

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  onClose: () => void;
}

const LeadDialog = ({ open, onOpenChange, leadId, onClose }: LeadDialogProps) => {
  const { leads, createLead, updateLead } = useCRM();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "manual",
    status: "new",
    notes: "",
    next_step: "",
    next_step_date: "",
  });

  const existingLead = leadId ? leads.find((l) => l.id === leadId) : null;

  useEffect(() => {
    if (existingLead) {
      setFormData({
        name: existingLead.name,
        email: existingLead.email,
        phone: existingLead.phone || "",
        company: existingLead.company || "",
        source: existingLead.source,
        status: existingLead.status,
        notes: existingLead.notes || "",
        next_step: existingLead.next_step || "",
        next_step_date: existingLead.next_step_date || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "manual",
        status: "new",
        notes: "",
        next_step: "",
        next_step_date: "",
      });
    }
  }, [existingLead, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      phone: formData.phone || null,
      company: formData.company || null,
      notes: formData.notes || null,
      next_step: formData.next_step || null,
      next_step_date: formData.next_step_date || null,
      assigned_to: null,
    };

    if (existingLead) {
      updateLead.mutate({ id: existingLead.id, ...payload });
    } else {
      createLead.mutate(payload);
    }

    onOpenChange(false);
    onClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingLead ? "Edytuj lead" : "Nowy lead"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Firma</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Źródło</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Ręczne</SelectItem>
                  <SelectItem value="fotz.pl">fotz.pl</SelectItem>
                  <SelectItem value="referral">Polecenie</SelectItem>
                  <SelectItem value="social">Social media</SelectItem>
                  <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nowy</SelectItem>
                  <SelectItem value="contacted">Po kontakcie</SelectItem>
                  <SelectItem value="qualified">Kwalifikowany</SelectItem>
                  <SelectItem value="nurture">Nurture</SelectItem>
                  <SelectItem value="lost">Przegrany</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="next_step">Następny krok</Label>
              <Input
                id="next_step"
                value={formData.next_step}
                onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
                placeholder="np. Zadzwonić z ofertą"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_step_date">Data następnego kroku</Label>
              <Input
                id="next_step_date"
                type="date"
                value={formData.next_step_date}
                onChange={(e) => setFormData({ ...formData, next_step_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notatki</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>


          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Anuluj
            </Button>
            <Button type="submit">
              {existingLead ? "Zapisz" : "Dodaj lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDialog;
