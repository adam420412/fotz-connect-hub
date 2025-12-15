import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, FileText, FileVideo, Loader2 } from "lucide-react";
import { formatFileSize } from "@/hooks/useProjectFiles";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (params: { file: File; projectId: string; uploadedBy: string }) => void;
  uploading: boolean;
}

const FileUploadDialog = ({
  open,
  onOpenChange,
  onUpload,
  uploading,
}: FileUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectId, setProjectId] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && projectId && uploadedBy) {
      onUpload({ file: selectedFile, projectId, uploadedBy });
      // Reset form after successful upload
      setSelectedFile(null);
      setProjectId("");
      setUploadedBy("");
      onOpenChange(false);
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith("image/")) return <FileImage className="h-8 w-8 text-accent" />;
    if (type.startsWith("video/")) return <FileVideo className="h-8 w-8 text-primary" />;
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setProjectId("");
    setUploadedBy("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prześlij plik</DialogTitle>
          <DialogDescription>
            Wybierz plik do przesłania i uzupełnij dane projektu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="flex items-center gap-4">
                {getFileIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-foreground font-medium">
                  Przeciągnij plik tutaj lub{" "}
                  <label className="text-primary cursor-pointer hover:underline">
                    wybierz z dysku
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Maksymalny rozmiar: 50MB
                </p>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Nazwa projektu</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="np. Rebranding Klient ABC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadedBy">Przesłane przez</Label>
              <Input
                id="uploadedBy"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="np. Anna K."
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={!selectedFile || !projectId || !uploadedBy || uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Przesyłanie...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Prześlij
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
