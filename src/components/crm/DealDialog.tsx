import { useState } from "react";
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

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
}

const DealDialog = ({ open, onOpenChange, leads }: DealDialogProps) => {
  const { createDeal } = useCRM();
  const [formData, setFormData] = useState({
    title: "",
    lead_id: "",
    value: "",
    stage: "qualification",
    probability: "10",
    expected_close_date: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createDeal.mutate({
      title: formData.title,
      lead_id: formData.lead_id || null,
      value: parseFloat(formData.value) || 0,
      currency: "PLN",
      stage: formData.stage,
      probability: parseInt(formData.probability) || 10,
      expected_close_date: formData.expected_close_date || null,
      notes: formData.notes || null,
      assigned_to: null,
    });

    setFormData({
      title: "",
      lead_id: "",
      value: "",
      stage: "qualification",
      probability: "10",
      expected_close_date: "",
      notes: "",
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nowy deal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nazwa deala *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="np. Sesja zdjęciowa - Firma XYZ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead">Powiązany lead</Label>
            <Select
              value={formData.lead_id}
              onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz lead (opcjonalnie)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Brak</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} ({lead.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Wartość (PLN)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Prawdopodobieństwo (%)</Label>
              <Select
                value={formData.probability}
                onValueChange={(value) => setFormData({ ...formData, probability: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Etap</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualification">Kwalifikacja</SelectItem>
                  <SelectItem value="proposal">Propozycja</SelectItem>
                  <SelectItem value="negotiation">Negocjacje</SelectItem>
                  <SelectItem value="closed_won">Wygrane</SelectItem>
                  <SelectItem value="closed_lost">Przegrane</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Przewidywana data zamknięcia</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit">Dodaj deal</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealDialog;
