import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  FolderPlus,
  Folder,
  FileImage,
  FileText,
  FileVideo,
  Check,
  X,
  Eye,
  Download,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useProjectFiles, formatFileSize, FileStatus, ProjectFile } from "@/hooks/useProjectFiles";
import { useFileFolders, FileFolder } from "@/hooks/useFileFolders";
import FilePreviewDialog from "@/components/files/FilePreviewDialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

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

const ApprovalCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDate, setNewFolderDate] = useState("");

  const { files, isLoading: filesLoading, updateStatus, downloadFile } = useProjectFiles();
  const { folders, isLoading: foldersLoading, createFolder, isCreating } = useFileFolders();

  // Filter files needing approval
  const pendingFiles = files.filter((f) => f.status === "pending_approval");
  
  // Filter by folder and search
  const filteredFiles = pendingFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === null || (file as any).folder_id === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleApprove = (fileId: string) => {
    updateStatus({ fileId, status: "approved" });
  };

  const handleReject = (fileId: string) => {
    updateStatus({ fileId, status: "rejected" });
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder({
        name: newFolderName.trim(),
        eventDate: newFolderDate || undefined,
      });
      setNewFolderName("");
      setNewFolderDate("");
      setCreateFolderOpen(false);
    }
  };

  const isLoading = filesLoading || foldersLoading;

  return (
    <DashboardLayout title="Centrum Akceptacji">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Centrum Akceptacji</h1>
            <p className="text-muted-foreground">
              {pendingFiles.length} {pendingFiles.length === 1 ? "plik czeka" : "plików czeka"} na akceptację
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj plików..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nowy folder</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Utwórz nowy folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nazwa folderu</Label>
                    <Input
                      placeholder="np. Sesja zdjęciowa - Produkt X"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data wydarzenia (opcjonalnie)</Label>
                    <Input
                      type="date"
                      value={newFolderDate}
                      onChange={(e) => setNewFolderDate(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateFolder} 
                    className="w-full"
                    disabled={!newFolderName.trim() || isCreating}
                  >
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Utwórz folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Folders Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Foldery</h3>
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedFolder === null 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1 truncate">Wszystkie pliki</span>
              <Badge variant="secondary" className="text-xs">
                {pendingFiles.length}
              </Badge>
            </button>
            
            {folders.map((folder) => {
              const folderFileCount = pendingFiles.filter(
                (f) => (f as any).folder_id === folder.id
              ).length;
              
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedFolder === folder.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Folder className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{folder.name}</p>
                    {folder.event_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(folder.event_date), "d MMM yyyy", { locale: pl })}
                      </p>
                    )}
                  </div>
                  {folderFileCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {folderFileCount}
                    </Badge>
                  )}
                </button>
              );
            })}

            {folders.length === 0 && !foldersLoading && (
              <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                Brak folderów. Utwórz pierwszy folder, aby organizować pliki.
              </p>
            )}
          </div>

          {/* Files Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                <Check className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-foreground">Wszystko zaakceptowane!</h3>
                <p className="text-muted-foreground">
                  Nie ma plików oczekujących na akceptację
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    {/* Preview */}
                    <div 
                      className="aspect-video flex items-center justify-center bg-muted cursor-pointer relative"
                      onClick={() => setPreviewFile(file)}
                    >
                      <FileIcon type={file.file_type} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.file_size)} • v{file.version}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-1"
                          onClick={() => handleApprove(file.id)}
                        >
                          <Check className="h-3 w-3" />
                          Akceptuj
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleReject(file.id)}
                        >
                          <X className="h-3 w-3" />
                          Odrzuć
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onDownload={downloadFile}
      />
    </DashboardLayout>
  );
};

export default ApprovalCenter;
