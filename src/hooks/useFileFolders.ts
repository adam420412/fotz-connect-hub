import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["file-folders"] });
      toast({
        title: "Folder utworzony",
        description: "Nowy folder został dodany",
      });
      logActivity("folder_create", "folder", data.id, variables.name, {
        event_date: variables.eventDate,
        client_id: variables.clientId,
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
    onSuccess: (_, folderId) => {
      queryClient.invalidateQueries({ queryKey: ["file-folders"] });
      toast({
        title: "Folder usunięty",
      });
      logActivity("folder_delete", "folder", folderId);
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      toast({
        title: "Plik przeniesiony",
      });
      logActivity("folder_assign_file", "file", variables.fileId, null, {
        folder_id: variables.folderId,
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
