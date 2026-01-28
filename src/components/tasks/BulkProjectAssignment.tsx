import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FolderOpen, Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ClientRequest } from "@/hooks/useClientRequests";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface BulkProjectAssignmentProps {
  tasks: ClientRequest[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkProjectAssignment({
  tasks,
  open,
  onOpenChange,
}: BulkProjectAssignmentProps) {
  const { projects, isLoading: projectsLoading } = useProjects();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("none");
  const [isAssigning, setIsAssigning] = useState(false);

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  const handleAssign = async () => {
    if (selectedTasks.length === 0 || !selectedProject) return;

    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from("client_requests")
        .update({ project_id: selectedProject === "none" ? null : selectedProject })
        .in("id", selectedTasks);

      if (error) throw error;

      const project = projects.find((p) => p.id === selectedProject);
      toast({
        title: "Zadania przypisane",
        description: `${selectedTasks.length} zadań przypisano do projektu "${project?.name || "Brak projektu"}"`,
      });

      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      onOpenChange(false);
      setSelectedTasks([]);
      setSelectedProject("none");
    } catch (error: any) {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Masowe przypisanie do projektu
          </DialogTitle>
          <DialogDescription>
            Wybierz zadania i przypisz je do wybranego projektu
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz projekt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Bez projektu</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedTasks.length === tasks.length
                ? "Odznacz wszystkie"
                : "Zaznacz wszystkie"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Wybrano: {selectedTasks.length} z {tasks.length}
            </span>
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-2">
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleTask(task.id)}
                >
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.category?.name || "Bez kategorii"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedTasks.length === 0 || selectedProject === "none" || isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Przypisywanie...
              </>
            ) : (
              `Przypisz ${selectedTasks.length} zadań`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
