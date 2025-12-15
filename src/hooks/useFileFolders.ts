import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FileFolder {
  id: string;
  name: string;
  event_date: string | null;
  description: string | null;
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useFileFolders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["file-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("file_folders")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      return data as FileFolder[];
    },
  });

  const createFolder = useMutation({
    mutationFn: async ({ name, eventDate, description, clientId }: { 
      name: string; 
      eventDate?: string; 
      description?: string;
      clientId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("file_folders")
        .insert({
          name,
          event_date: eventDate || null,
          description: description || null,
          client_id: clientId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-folders"] });
      toast({
        title: "Folder utworzony",
        description: "Nowy folder został dodany",
      });
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("file_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file-folders"] });
      toast({
        title: "Folder usunięty",
      });
    },
  });

  const assignFileToFolder = useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: string; folderId: string | null }) => {
      const { error } = await supabase
        .from("project_files")
        .update({ folder_id: folderId })
        .eq("id", fileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      toast({
        title: "Plik przeniesiony",
      });
    },
  });

  return {
    folders,
    isLoading,
    createFolder: createFolder.mutate,
    deleteFolder: deleteFolder.mutate,
    assignFileToFolder: assignFileToFolder.mutate,
    isCreating: createFolder.isPending,
  };
}
