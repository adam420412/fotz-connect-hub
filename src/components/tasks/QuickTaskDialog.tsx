import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Loader2 } from "lucide-react";
import { useTaskCategories } from "@/hooks/useTaskCategories";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";

interface QuickTaskDialogProps {
  trigger?: React.ReactNode;
  defaultStatus?: string;
  defaultProjectId?: string;
}

export function QuickTaskDialog({ trigger, defaultStatus = "pending", defaultProjectId }: QuickTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [categoryId, setCategoryId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");

  const { categories } = useTaskCategories();
  const { teamMembers } = useTeamMembers();
  const { projects } = useProjects();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setCategoryId("");
    setAssignedTo("");
    setDeadline("");
    setProjectId(defaultProjectId || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("client_requests")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          request_type: "task",
          priority: priority as "low" | "normal" | "high" | "urgent",
          category_id: categoryId || null,
          assigned_to: assignedTo || null,
          deadline: deadline || null,
          status: defaultStatus,
          client_id: user.id,
          project_id: projectId || null,
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      
      logActivity("request_create", "request", data.id, title, {
        request_type: "task",
        priority,
        quick_add: true,
      });

      toast({
        title: "Zadanie dodane",
        description: "Nowe zadanie zostało utworzone",
      });

      resetForm();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Szybkie zadanie
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj szybkie zadanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tytuł *</Label>
            <Input
              id="title"
              placeholder="Nazwa zadania..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Opis (opcjonalny)</Label>
            <Textarea
              id="description"
              placeholder="Krótki opis..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priorytet</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niski</SelectItem>
                  <SelectItem value="normal">Normalny</SelectItem>
                  <SelectItem value="high">Wysoki</SelectItem>
                  <SelectItem value="urgent">Pilny</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Brak</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Przypisz do</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Brak</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Termin</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Projekt</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Przypisz do projektu..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Brak projektu</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                "Dodaj zadanie"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
