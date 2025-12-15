import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileImage, FileText, FileVideo, Loader2, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatFileSize } from "@/hooks/useProjectFiles";
import { cn } from "@/lib/utils";

export interface BriefAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  storagePath: string;
}

interface BriefAttachmentsProps {
  attachments: BriefAttachment[];
  onAttachmentsChange: (attachments: BriefAttachment[]) => void;
  maxFiles?: number;
}

const BriefAttachments = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
}: BriefAttachmentsProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const uploadFile = async (file: File): Promise<BriefAttachment | null> => {
    try {
      const timestamp = Date.now();
      const storagePath = `brief-attachments/${timestamp}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      return {
        id: `${timestamp}-${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        storagePath,
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Błąd przesyłania: ${file.name}`);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - attachments.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`Możesz dodać maksymalnie ${maxFiles} plików`);
      return;
    }

    // Check file sizes (max 20MB each)
    const oversizedFiles = fileArray.filter(f => f.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Maksymalny rozmiar pliku to 20MB");
      return;
    }

    setUploading(true);
    const uploadedFiles: BriefAttachment[] = [];

    for (const file of fileArray) {
      const uploaded = await uploadFile(file);
      if (uploaded) {
        uploadedFiles.push(uploaded);
      }
    }

    onAttachmentsChange([...attachments, ...uploadedFiles]);
    setUploading(false);

    if (uploadedFiles.length > 0) {
      toast.success(`Dodano ${uploadedFiles.length} plik(ów)`);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [attachments, maxFiles]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeAttachment = async (attachment: BriefAttachment) => {
    // Remove from storage
    await supabase.storage
      .from("project-files")
      .remove([attachment.storagePath]);

    onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id));
    toast.success("Plik usunięty");
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <FileImage className="h-4 w-4 text-accent" />;
    if (type.startsWith("video/")) return <FileVideo className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          <span>Załączniki ({attachments.length}/{maxFiles})</span>
        </div>
      </div>

      {/* Uploaded Files */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 border border-border"
            >
              {getFileIcon(attachment.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {attachment.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeAttachment(attachment)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {attachments.length < maxFiles && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 transition-colors",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Przesyłanie...</span>
            </div>
          ) : (
            <div className="text-center py-2">
              <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Przeciągnij pliki lub{" "}
                <label className="text-primary cursor-pointer hover:underline">
                  wybierz z dysku
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max {maxFiles} plików, do 20MB każdy
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BriefAttachments;
