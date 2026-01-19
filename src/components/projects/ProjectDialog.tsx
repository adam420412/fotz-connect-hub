import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Slider } from "@/components/ui/slider";
import { Plus, Edit, Loader2 } from "lucide-react";
import { Project, CreateProjectData, UpdateProjectData } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";

interface ProjectDialogProps {
  project?: Project;
  onSave: (data: CreateProjectData | UpdateProjectData) => void;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function ProjectDialog({ project, onSave, isLoading, trigger }: ProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "paused" | "completed">("active");
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [clientId, setClientId] = useState("");
  
  const { data: clients = [] } = useClients();

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setStatus(project.status);
      setProgress(project.progress);
      setDueDate(project.due_date || "");
      setClientId(project.client_id || "");
    } else {
      setName("");
      setDescription("");
      setStatus("active");
      setProgress(0);
      setDueDate("");
      setClientId("");
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (project) {
      onSave({
        id: project.id,
        name,
        description: description || undefined,
        status,
        progress,
        due_date: dueDate || undefined,
        client_id: clientId || undefined,
      });
    } else {
      onSave({
        name,
        description: description || undefined,
        status,
        due_date: dueDate || undefined,
        client_id: clientId || undefined,
      });
    }
    setOpen(false);
  };

  const defaultTrigger = project ? (
    <Button variant="ghost" size="icon">
      <Edit className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="gradient" className="gap-2">
      <Plus className="h-4 w-4" />
      Nowy projekt
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{project ? "Edytuj projekt" : "Nowy projekt"}</DialogTitle>
          <DialogDescription>
            {project ? "Zaktualizuj dane projektu" : "Utwórz nowy projekt"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nazwa projektu *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa projektu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opis projektu..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="paused">Wstrzymany</SelectItem>
                  <SelectItem value="completed">Zakończony</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Termin</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {project && (
            <div className="space-y-2">
              <Label>Postęp: {progress}%</Label>
              <Slider
                value={[progress]}
                onValueChange={(v) => setProgress(v[0])}
                max={100}
                step={5}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="client">Klient</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz klienta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Brak klienta</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.full_name || client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {project ? "Zapisz" : "Utwórz"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
