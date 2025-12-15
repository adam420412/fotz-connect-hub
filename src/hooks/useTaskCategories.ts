import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTaskCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["task-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as TaskCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const { data: result, error } = await supabase
        .from("task_categories")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-categories"] });
      toast({
        title: "Kategoria utworzona",
        description: "Nowa kategoria została dodana",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-categories"] });
      toast({
        title: "Kategoria usunięta",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async (data: { id: string; name: string; color: string }) => {
      const { data: result, error } = await supabase
        .from("task_categories")
        .update({ name: data.name, color: data.color })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-categories"] });
    },
  });

  return {
    categories,
    isLoading,
    createCategory: createCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    updateCategory: updateCategory.mutate,
  };
}
