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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FileStatus = "draft" | "pending_approval" | "approved" | "rejected";

interface FileItem {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  size: string;
  project: string;
  uploadedBy: string;
  uploadedAt: string;
  status: FileStatus;
  version: number;
  thumbnail?: string;
}

const mockFiles: FileItem[] = [
  {
    id: "1",
    name: "Logo_final_v3.ai",
    type: "image",
    size: "2.4 MB",
    project: "Rebranding Klient ABC",
    uploadedBy: "Anna K.",
    uploadedAt: "2 godz. temu",
    status: "approved",
    version: 3,
  },
  {
    id: "2",
    name: "Mockup_strona_glowna.fig",
    type: "image",
    size: "8.1 MB",
    project: "Strona WWW - XYZ Corp",
    uploadedBy: "Piotr N.",
    uploadedAt: "3 godz. temu",
    status: "pending_approval",
    version: 2,
  },
  {
    id: "3",
    name: "Video_promo_30s.mp4",
    type: "video",
    size: "45.2 MB",
    project: "Kampania Social Media",
    uploadedBy: "Tomek W.",
    uploadedAt: "1 dzień temu",
    status: "pending_approval",
    version: 1,
  },
  {
    id: "4",
    name: "Strategia_marketingowa.pdf",
    type: "document",
    size: "1.2 MB",
    project: "Rebranding Klient ABC",
    uploadedBy: "Michał P.",
    uploadedAt: "2 dni temu",
    status: "approved",
    version: 1,
  },
  {
    id: "5",
    name: "Wizytowki_projekt.pdf",
    type: "document",
    size: "3.5 MB",
    project: "Rebranding Klient ABC",
    uploadedBy: "Ewa S.",
    uploadedAt: "3 dni temu",
    status: "rejected",
    version: 2,
  },
];

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

const Files = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<FileStatus | "all">("all");

  const filteredFiles = mockFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Pliki" userRole="client">
      <div className="space-y-6">
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
            <Button variant="gradient" className="gap-2">
              <Upload className="h-4 w-4" />
              Prześlij plik
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

        {/* Files Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-muted">
                  <FileIcon type={file.type} />
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Podgląd
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Pobierz
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground">{file.project}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={statusConfig[file.status].variant}>
                      {statusConfig[file.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">v{file.version}</span>
                  </div>
                  {file.status === "pending_approval" && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="default" className="flex-1 gap-1">
                        <Check className="h-3 w-3" />
                        Akceptuj
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1">
                        <X className="h-3 w-3" />
                        Odrzuć
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                        <FileIcon type={file.type} />
                        <div>
                          <p className="font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.uploadedAt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{file.project}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{file.size}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[file.status].variant}>
                        {statusConfig[file.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Brak plików</h3>
            <p className="text-muted-foreground">Nie znaleziono plików pasujących do kryteriów</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Files;
