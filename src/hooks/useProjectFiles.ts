import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/hooks/useActivityLogger";

export type FileStatus = "draft" | "pending_approval" | "approved" | "rejected";

export interface ProjectFile {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  project_id: string;
  uploaded_by: string;
  status: FileStatus;
  version: number;
  storage_path: string;
  created_at: string;
  updated_at: string;
  parent_file_id: string | null;
  folder_id: string | null;
}

export const useProjectFiles = () => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ["project-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectFile[];
    },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ 
      file, 
      projectId, 
      uploadedBy 
    }: { 
      file: File; 
      projectId: string; 
      uploadedBy: string;
    }) => {
      setUploading(true);
      
      try {
        // Generate unique path
        const timestamp = Date.now();
        const storagePath = `${projectId}/${timestamp}_${file.name}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Determine file type category
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType = 'document';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ai', 'psd', 'fig'].includes(fileExtension)) {
          fileType = 'image';
        } else if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension)) {
          fileType = 'video';
        }

        // Insert record in database
        const { data, error: dbError } = await supabase
          .from("project_files")
          .insert({
            name: file.name,
            file_type: fileType,
            file_size: file.size,
            project_id: projectId,
            uploaded_by: uploadedBy,
            storage_path: storagePath,
            status: "pending_approval",
            version: 1,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        return data;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      toast.success("Plik został przesłany");
      logActivity("file_upload", "file", data.id, variables.file.name, {
        project_id: variables.projectId,
        file_size: variables.file.size,
        file_type: data.file_type,
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Błąd podczas przesyłania pliku");
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ fileId, status }: { fileId: string; status: FileStatus }) => {
      const { data, error } = await supabase
        .from("project_files")
        .update({ status })
        .eq("id", fileId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      const statusMessages: Record<FileStatus, string> = {
        approved: "Plik został zaakceptowany",
        rejected: "Plik został odrzucony",
        pending_approval: "Plik oczekuje na akceptację",
        draft: "Plik zapisany jako roboczy",
      };
      toast.success(statusMessages[variables.status]);
      logActivity("file_status_change", "file", variables.fileId, data.name, {
        new_status: variables.status,
      });
    },
    onError: () => {
      toast.error("Błąd podczas aktualizacji statusu");
    },
  });

  const getFileUrl = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || null;
  };

  const downloadFile = async (file: ProjectFile) => {
    const { data, error } = await supabase.storage
      .from("project-files")
      .download(file.storage_path);

    if (error) {
      toast.error("Błąd podczas pobierania pliku");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    files,
    isLoading,
    error,
    uploading,
    uploadFile: uploadFile.mutate,
    updateStatus: updateStatus.mutate,
    getFileUrl,
    downloadFile,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
