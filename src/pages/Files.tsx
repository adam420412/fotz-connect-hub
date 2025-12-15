import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Upload,
  FolderOpen,
  FileImage,
  FileText,
  FileVideo,
  Download,
  Eye,
  Check,
  X,
  MoreVertical,
  Grid,
  List,
  Loader2,
  MessageSquare,
  PanelRightOpen,
  PanelRightClose,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectFiles, formatFileSize, FileStatus, ProjectFile } from "@/hooks/useProjectFiles";
import FileUploadDialog from "@/components/files/FileUploadDialog";
import FilePreviewDialog from "@/components/files/FilePreviewDialog";
import FileCommentsPanel from "@/components/files/FileCommentsPanel";
import FileVersionHistoryDialog from "@/components/files/FileVersionHistoryDialog";

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
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Przed chwilą";
  if (diffHours < 24) return `${diffHours} godz. temu`;
  if (diffDays === 1) return "1 dzień temu";
  if (diffDays < 7) return `${diffDays} dni temu`;
  return date.toLocaleDateString("pl-PL");
};

const Files = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<FileStatus | "all">("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [selectedFileForComments, setSelectedFileForComments] = useState<ProjectFile | null>(null);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const [versionHistoryFile, setVersionHistoryFile] = useState<ProjectFile | null>(null);

  const {
    files,
    isLoading,
    uploading,
    uploadFile,
    updateStatus,
    downloadFile,
  } = useProjectFiles();

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.project_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (fileId: string) => {
    updateStatus({ fileId, status: "approved" });
  };

  const handleReject = (fileId: string) => {
    updateStatus({ fileId, status: "rejected" });
  };

  const handleOpenComments = (file: ProjectFile) => {
    setSelectedFileForComments(file);
    setCommentsPanelOpen(true);
  };

  const handleOpenVersionHistory = (file: ProjectFile) => {
    setVersionHistoryFile(file);
  };

  return (
    <DashboardLayout title="Pliki">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className={`flex-1 space-y-6 transition-all ${commentsPanelOpen ? "lg:mr-80" : ""}`}>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj plików..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="gradient" 
              className="gap-2"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Prześlij plik
            </Button>
            <Button
              variant={commentsPanelOpen ? "secondary" : "outline"}
              size="icon"
              onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
              className="hidden lg:flex"
            >
              {commentsPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending_approval", "approved", "rejected", "draft"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "Wszystkie" : statusConfig[status].label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Files Grid/List */}
        {!isLoading && viewMode === "grid" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div 
                  className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-muted cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  <FileIcon type={file.file_type} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground truncate">{file.name}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Podgląd
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenComments(file)}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Komentarze
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenVersionHistory(file)}>
                          <History className="mr-2 h-4 w-4" />
                          Historia wersji
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Pobierz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground">{file.project_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant={statusConfig[file.status as FileStatus].variant}>
                      {statusConfig[file.status as FileStatus].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{file.version}</span>
                  </div>
                  {file.status === "pending_approval" && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="default" 
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
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && viewMode === "list" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Nazwa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Projekt</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Rozmiar</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.file_type} />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(file.created_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{file.project_id}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatFileSize(file.file_size)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[file.status as FileStatus].variant}>
                        {statusConfig[file.status as FileStatus].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => downloadFile(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {file.status === "pending_approval" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-green-600 hover:text-green-700"
                              onClick={() => handleApprove(file.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleReject(file.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Brak plików</h3>
            <p className="text-muted-foreground mb-4">
              {files.length === 0 
                ? "Prześlij pierwszy plik, aby rozpocząć" 
                : "Nie znaleziono plików pasujących do kryteriów"
              }
            </p>
            {files.length === 0 && (
              <Button 
                variant="gradient" 
                className="gap-2"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Prześlij plik
              </Button>
            )}
          </div>
        )}
        </div>

        {/* Comments Side Panel */}
        {commentsPanelOpen && (
          <div className="fixed right-0 top-0 h-full w-80 border-l border-border bg-card shadow-lg z-40 hidden lg:block">
            <FileCommentsPanel
              fileId={selectedFileForComments?.id || null}
              fileName={selectedFileForComments?.name || ""}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={uploadFile}
        uploading={uploading}
      />

      <FilePreviewDialog
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onDownload={downloadFile}
      />

      <FileVersionHistoryDialog
        file={versionHistoryFile}
        open={!!versionHistoryFile}
        onOpenChange={(open) => !open && setVersionHistoryFile(null)}
      />
    </DashboardLayout>
  );
};

export default Files;
