import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Upload,
  RotateCcw,
  Download,
  Eye,
  Loader2,
  FileImage,
  FileText,
  FileVideo,
  Clock,
  User,
} from "lucide-react";
import { ProjectFile, formatFileSize, FileStatus } from "@/hooks/useProjectFiles";
import { useFileVersions } from "@/hooks/useFileVersions";
import { supabase } from "@/integrations/supabase/client";

interface FileVersionHistoryDialogProps {
  file: ProjectFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<FileStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Roboczy", variant: "secondary" },
  pending_approval: { label: "Do akceptacji", variant: "outline" },
  approved: { label: "Zaakceptowany", variant: "default" },
  rejected: { label: "Odrzucony", variant: "destructive" },
};

const FileIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "image":
      return <FileImage className="h-5 w-5 text-accent" />;
    case "video":
      return <FileVideo className="h-5 w-5 text-primary" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const FileVersionHistoryDialog = ({
  file,
  open,
  onOpenChange,
}: FileVersionHistoryDialogProps) => {
  const [uploadedBy, setUploadedBy] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    versions,
    isLoading,
    uploadNewVersion,
    restoreVersion,
    isUploading,
    isRestoring,
  } = useFileVersions(file?.id || null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadNewVersion = () => {
    if (!selectedFile || !uploadedBy.trim() || !file) return;

    uploadNewVersion({
      file: selectedFile,
      currentFile: file,
      uploadedBy: uploadedBy.trim(),
    });

    setSelectedFile(null);
    setUploadedBy("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRestore = (versionToRestore: ProjectFile) => {
    if (!file) return;

    const restoredBy = prompt("Podaj swoje imię:");
    if (!restoredBy) return;

    restoreVersion({
      versionToRestore,
      currentFile: file,
      restoredBy,
    });
  };

  const handleDownload = async (version: ProjectFile) => {
    const { data, error } = await supabase.storage
      .from("project-files")
      .download(version.storage_path);

    if (error) {
      console.error("Download error:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = version.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (version: ProjectFile) => {
    const { data } = await supabase.storage
      .from("project-files")
      .createSignedUrl(version.storage_path, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (!file) return null;

  const currentVersion = versions.find((v) => v.id === file.id);
  const isCurrentVersion = (v: ProjectFile) => v.id === file.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historia wersji
          </DialogTitle>
          <DialogDescription className="truncate">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        {/* Upload New Version */}
        <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Prześlij nową wersję
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="newVersionFile" className="text-xs">
                Plik
              </Label>
              <Input
                id="newVersionFile"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="uploadedBy" className="text-xs">
                Przesłane przez
              </Label>
              <Input
                id="uploadedBy"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="Twoje imię"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={handleUploadNewVersion}
            disabled={!selectedFile || !uploadedBy.trim() || isUploading}
            variant="gradient"
            size="sm"
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Prześlij jako v{(versions[0]?.version || file.version) + 1}
          </Button>
        </div>

        {/* Version List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Brak historii wersji</p>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    isCurrentVersion(version)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <FileIcon type={version.file_type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          v{version.version}
                        </span>
                        {isCurrentVersion(version) && (
                          <Badge variant="default" className="text-xs">
                            Aktualna
                          </Badge>
                        )}
                        {index === 0 && !isCurrentVersion(version) && (
                          <Badge variant="secondary" className="text-xs">
                            Najnowsza
                          </Badge>
                        )}
                        <Badge
                          variant={statusConfig[version.status as FileStatus].variant}
                          className="text-xs"
                        >
                          {statusConfig[version.status as FileStatus].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground truncate mt-1">
                        {version.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(version.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.uploaded_by}
                        </span>
                        <span>{formatFileSize(version.file_size)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePreview(version)}
                        title="Podgląd"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(version)}
                        title="Pobierz"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!isCurrentVersion(version) && index !== 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary"
                          onClick={() => handleRestore(version)}
                          disabled={isRestoring}
                          title="Przywróć tę wersję"
                        >
                          {isRestoring ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FileVersionHistoryDialog;
