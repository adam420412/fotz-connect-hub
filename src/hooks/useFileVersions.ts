import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectFile } from "./useProjectFiles";
import { logActivity } from "@/hooks/useActivityLogger";

export const useFileVersions = (fileId: string | null) => {
  const queryClient = useQueryClient();

  // Get all versions of a file (including the current one and all parent/child versions)
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["file-versions", fileId],
    queryFn: async () => {
      if (!fileId) return [];

      // First get the current file
      const { data: currentFile, error: currentError } = await supabase
        .from("project_files")
        .select("*")
        .eq("id", fileId)
        .single();

      if (currentError) throw currentError;

      // Find the root file (oldest version)
      let rootId = currentFile.id;
      let parentId = currentFile.parent_file_id;

      // Traverse up to find the root
      while (parentId) {
        const { data: parentFile } = await supabase
          .from("project_files")
          .select("id, parent_file_id")
          .eq("id", parentId)
          .single();

        if (parentFile) {
          rootId = parentFile.id;
          parentId = parentFile.parent_file_id;
        } else {
          break;
        }
      }

      // Now get all files in this version chain
      // Get root file
      const { data: rootFile } = await supabase
        .from("project_files")
        .select("*")
        .eq("id", rootId)
        .single();

      // Get all descendants
      const allVersions: ProjectFile[] = rootFile ? [rootFile as ProjectFile] : [];
      
      // Recursive function to get children
      const getChildren = async (parentId: string) => {
        const { data: children } = await supabase
          .from("project_files")
          .select("*")
          .eq("parent_file_id", parentId)
          .order("version", { ascending: true });

        if (children && children.length > 0) {
          for (const child of children) {
            allVersions.push(child as ProjectFile);
            await getChildren(child.id);
          }
        }
      };

      if (rootFile) {
        await getChildren(rootFile.id);
      }

      // Sort by version descending (newest first)
      return allVersions.sort((a, b) => b.version - a.version);
    },
    enabled: !!fileId,
  });

  // Upload a new version
  const uploadNewVersion = useMutation({
    mutationFn: async ({
      file,
      currentFile,
      uploadedBy,
    }: {
      file: File;
      currentFile: ProjectFile;
      uploadedBy: string;
    }) => {
      // Get the highest version number in this file chain
      const highestVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version)) 
        : currentFile.version;

      // Upload to storage
      const timestamp = Date.now();
      const storagePath = `${currentFile.project_id}/${timestamp}_v${highestVersion + 1}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Determine file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType = 'document';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ai', 'psd', 'fig'].includes(fileExtension)) {
        fileType = 'image';
      } else if (['mp4', 'mov', 'avi', 'webm'].includes(fileExtension)) {
        fileType = 'video';
      }

      // Create new version record
      const { data, error: dbError } = await supabase
        .from("project_files")
        .insert({
          name: file.name,
          file_type: fileType,
          file_size: file.size,
          project_id: currentFile.project_id,
          uploaded_by: uploadedBy,
          storage_path: storagePath,
          status: "pending_approval",
          version: highestVersion + 1,
          parent_file_id: currentFile.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["file-versions", fileId] });
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      toast.success("Nowa wersja została przesłana");
      logActivity("file_version_upload", "file", data.id, variables.file.name, {
        version: data.version,
        parent_file_id: variables.currentFile.id,
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Błąd podczas przesyłania nowej wersji");
    },
  });

  // Restore a previous version (creates a new version based on the old one)
  const restoreVersion = useMutation({
    mutationFn: async ({
      versionToRestore,
      currentFile,
      restoredBy,
    }: {
      versionToRestore: ProjectFile;
      currentFile: ProjectFile;
      restoredBy: string;
    }) => {
      // Download the old version
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("project-files")
        .download(versionToRestore.storage_path);

      if (downloadError) throw downloadError;

      // Get the highest version number
      const highestVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version)) 
        : currentFile.version;

      // Upload as new version
      const timestamp = Date.now();
      const storagePath = `${currentFile.project_id}/${timestamp}_v${highestVersion + 1}_restored_${versionToRestore.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, fileData);

      if (uploadError) throw uploadError;

      // Create new version record
      const { data, error: dbError } = await supabase
        .from("project_files")
        .insert({
          name: versionToRestore.name,
          file_type: versionToRestore.file_type,
          file_size: versionToRestore.file_size,
          project_id: currentFile.project_id,
          uploaded_by: restoredBy,
          storage_path: storagePath,
          status: "pending_approval",
          version: highestVersion + 1,
          parent_file_id: currentFile.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["file-versions", fileId] });
      queryClient.invalidateQueries({ queryKey: ["project-files"] });
      toast.success("Wersja została przywrócona jako nowa wersja");
      logActivity("file_version_restore", "file", data.id, variables.versionToRestore.name, {
        restored_version: variables.versionToRestore.version,
        new_version: data.version,
      });
    },
    onError: (error) => {
      console.error("Restore error:", error);
      toast.error("Błąd podczas przywracania wersji");
    },
  });

  return {
    versions,
    isLoading,
    uploadNewVersion: uploadNewVersion.mutate,
    restoreVersion: restoreVersion.mutate,
    isUploading: uploadNewVersion.isPending,
    isRestoring: restoreVersion.isPending,
  };
};
