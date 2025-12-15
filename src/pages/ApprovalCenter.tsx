import { useState, DragEvent } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Loader2,
  Users,
  GripVertical,
} from "lucide-react";
import { useProjectFiles, formatFileSize, FileStatus, ProjectFile } from "@/hooks/useProjectFiles";
import { useFileFolders, FileFolder } from "@/hooks/useFileFolders";
import { useClients } from "@/hooks/useClients";
import FilePreviewDialog from "@/components/files/FilePreviewDialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

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
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDate, setNewFolderDate] = useState("");
  const [newFolderClient, setNewFolderClient] = useState<string>("");
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const { files, isLoading: filesLoading, updateStatus, downloadFile } = useProjectFiles();
  const { folders, isLoading: foldersLoading, createFolder, assignFileToFolder, isCreating } = useFileFolders();
  const { data: clients = [], isLoading: clientsLoading } = useClients();

  // Filter files needing approval
  const pendingFiles = files.filter((f) => f.status === "pending_approval");
  
  // Filter by folder, client and search
  const filteredFiles = pendingFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === null || file.folder_id === selectedFolder;
    // For client filter, we'd need to check the folder's client_id
    const folder = folders.find(f => f.id === file.folder_id);
    const matchesClient = selectedClient === "all" || 
      (folder?.client_id === selectedClient) ||
      (selectedClient === "unassigned" && !file.folder_id);
    return matchesSearch && matchesFolder && matchesClient;
  });

  // Filter folders by selected client
  const filteredFolders = folders.filter((folder) => {
    if (selectedClient === "all") return true;
    if (selectedClient === "unassigned") return !folder.client_id;
    return folder.client_id === selectedClient;
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
        clientId: newFolderClient || undefined,
      });
      setNewFolderName("");
      setNewFolderDate("");
      setNewFolderClient("");
      setCreateFolderOpen(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, fileId: string) => {
    setDraggedFileId(fileId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", fileId);
  };

  const handleDragEnd = () => {
    setDraggedFileId(null);
    setDragOverFolderId(null);
  };

  const handleDragOver = (e: DragEvent<HTMLButtonElement>, folderId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(folderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>, folderId: string | null) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData("text/plain");
    
    if (fileId && folderId !== dragOverFolderId) {
      assignFileToFolder({ fileId, folderId });
      toast.success(folderId ? "Plik przeniesiony do folderu" : "Plik usunięty z folderu");
    }
    
    setDraggedFileId(null);
    setDragOverFolderId(null);
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client?.company_name || client?.full_name || client?.email;
  };

  const isLoading = filesLoading || foldersLoading || clientsLoading;

  return (
    <DashboardLayout title="Centrum Akceptacji">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Centrum Akceptacji</h1>
            <p className="text-muted-foreground">
              {pendingFiles.length} {pendingFiles.length === 1 ? "plik czeka" : "plików czeka"} na akceptację
              {draggedFileId && <span className="text-primary ml-2">• Przeciągnij plik do folderu</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Client Filter */}
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Wybierz klienta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy klienci</SelectItem>
                <SelectItem value="unassigned">Nieprzypisane</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name || client.full_name || client.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 sm:w-48">
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
                  <div className="space-y-2">
                    <Label>Przypisz do klienta</Label>
                    <Select value={newFolderClient} onValueChange={setNewFolderClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz klienta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name || client.full_name || client.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Foldery {selectedClient !== "all" && "(filtrowane)"}
            </h3>
            
            {/* All files - drop zone */}
            <button
              onClick={() => setSelectedFolder(null)}
              onDragOver={(e) => handleDragOver(e, null)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                selectedFolder === null 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              } ${dragOverFolderId === null && draggedFileId ? "ring-2 ring-primary ring-dashed bg-primary/5" : ""}`}
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1 truncate">Wszystkie pliki</span>
              <Badge variant="secondary" className="text-xs">
                {pendingFiles.length}
              </Badge>
            </button>
            
            {filteredFolders.map((folder) => {
              const folderFileCount = pendingFiles.filter(
                (f) => f.folder_id === folder.id
              ).length;
              const clientName = getClientName(folder.client_id);
              const isDragOver = dragOverFolderId === folder.id;
              
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedFolder === folder.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  } ${isDragOver && draggedFileId ? "ring-2 ring-primary ring-dashed bg-primary/5 scale-[1.02]" : ""}`}
                >
                  <Folder className={`h-4 w-4 ${isDragOver ? "text-primary" : ""}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{folder.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {folder.event_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(folder.event_date), "d MMM", { locale: pl })}
                        </span>
                      )}
                      {clientName && (
                        <span className="truncate">{clientName}</span>
                      )}
                    </div>
                  </div>
                  {folderFileCount > 0 && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {folderFileCount}
                    </Badge>
                  )}
                </button>
              );
            })}

            {filteredFolders.length === 0 && !foldersLoading && (
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
                {filteredFiles.map((file) => {
                  const folder = folders.find(f => f.id === file.folder_id);
                  const clientName = getClientName(folder?.client_id || null);
                  const isDragging = draggedFileId === file.id;
                  
                  return (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, file.id)}
                      onDragEnd={handleDragEnd}
                      className={`group rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md cursor-grab active:cursor-grabbing ${
                        isDragging ? "opacity-50 scale-95 ring-2 ring-primary" : ""
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {folder ? folder.name : "Nieprzypisany"}
                        </span>
                        {clientName && (
                          <Badge variant="outline" className="text-xs">
                            {clientName}
                          </Badge>
                        )}
                      </div>
                      
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
                  );
                })}
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
