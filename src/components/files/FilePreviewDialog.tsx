import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Check, X, FileImage, FileText, FileVideo, Loader2 } from "lucide-react";
import { ProjectFile, formatFileSize, FileStatus } from "@/hooks/useProjectFiles";
import { supabase } from "@/integrations/supabase/client";

interface FilePreviewDialogProps {
  file: ProjectFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (fileId: string) => void;
  onReject: (fileId: string) => void;
  onDownload: (file: ProjectFile) => void;
}

const statusConfig: Record<FileStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Roboczy", variant: "secondary" },
  pending_approval: { label: "Do akceptacji", variant: "outline" },
  approved: { label: "Zaakceptowany", variant: "default" },
  rejected: { label: "Odrzucony", variant: "destructive" },
};

const FilePreviewDialog = ({
  file,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onDownload,
}: FilePreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPreview = async () => {
      if (!file || !open) {
        setPreviewUrl(null);
        return;
      }

      setLoading(true);
      try {
        const { data } = await supabase.storage
          .from("project-files")
          .createSignedUrl(file.storage_path, 3600);
        
        setPreviewUrl(data?.signedUrl || null);
      } catch (error) {
        console.error("Error loading preview:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [file, open]);

  if (!file) return null;

  const isImage = file.file_type === "image" && 
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
  
  const isPdf = file.name.toLowerCase().endsWith('.pdf');
  const isVideo = file.file_type === "video";

  const FileIcon = () => {
    switch (file.file_type) {
      case "image":
        return <FileImage className="h-16 w-16 text-accent" />;
      case "video":
        return <FileVideo className="h-16 w-16 text-primary" />;
      default:
        return <FileText className="h-16 w-16 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="truncate">{file.name}</span>
            <Badge variant={statusConfig[file.status as FileStatus].variant}>
              {statusConfig[file.status as FileStatus].label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Ładowanie podglądu...</p>
            </div>
          ) : previewUrl ? (
            <>
              {isImage && (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
              {isPdf && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh]"
                  title={file.name}
                />
              )}
              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full max-h-[60vh]"
                />
              )}
              {!isImage && !isPdf && !isVideo && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <FileIcon />
                  <p className="text-muted-foreground">
                    Podgląd niedostępny dla tego typu pliku
                  </p>
                  <Button onClick={() => onDownload(file)} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Pobierz plik
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-12">
              <FileIcon />
              <p className="text-muted-foreground">Nie można załadować podglądu</p>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Rozmiar</p>
            <p className="font-medium text-foreground">{formatFileSize(file.file_size)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Wersja</p>
            <p className="font-medium text-foreground">v{file.version}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Przesłane przez</p>
            <p className="font-medium text-foreground">{file.uploaded_by}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data</p>
            <p className="font-medium text-foreground">
              {new Date(file.created_at).toLocaleDateString("pl-PL")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button onClick={() => onDownload(file)} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Pobierz
          </Button>
          
          {file.status === "pending_approval" && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onApprove(file.id);
                  onOpenChange(false);
                }}
                variant="default"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Akceptuj
              </Button>
              <Button
                onClick={() => {
                  onReject(file.id);
                  onOpenChange(false);
                }}
                variant="destructive"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Odrzuć
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
