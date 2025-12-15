import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock,
  User,
  FileText,
  Paperclip,
  FileImage,
  FileVideo,
  Download,
  Loader2,
  CheckSquare,
  MessageSquare,
  Send,
  UserPlus,
} from "lucide-react";
import { ClientRequest } from "@/hooks/useClientRequests";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatFileSize } from "@/hooks/useProjectFiles";
import RequestComments from "./RequestComments";

interface RequestDetailsDialogProps {
  request: ClientRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: ClientRequest["status"]) => void;
  onAssign?: (id: string, assignedTo: string | null) => void;
  isTeamMember?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Oczekuje", variant: "outline" },
  in_progress: { label: "W realizacji", variant: "secondary" },
  completed: { label: "Zakończone", variant: "default" },
  cancelled: { label: "Anulowane", variant: "destructive" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Niski", className: "text-muted-foreground" },
  normal: { label: "Normalny", className: "text-foreground" },
  high: { label: "Wysoki", className: "text-orange-600" },
  urgent: { label: "Pilny", className: "text-destructive font-semibold" },
};

const requestTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  task: { label: "Nowe zadanie", icon: <CheckSquare className="h-4 w-4" /> },
  feedback: { label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
  comment: { label: "Komentarz", icon: <FileText className="h-4 w-4" /> },
  other: { label: "Inne", icon: <Send className="h-4 w-4" /> },
};

interface ParsedAttachment {
  name: string;
  path: string;
  type: string;
}

const RequestDetailsDialog = ({
  request,
  open,
  onOpenChange,
  onStatusChange,
  onAssign,
  isTeamMember = false,
}: RequestDetailsDialogProps) => {
  const [newStatus, setNewStatus] = useState<ClientRequest["status"]>("pending");
  const [newAssignee, setNewAssignee] = useState<string>("");
  const [attachments, setAttachments] = useState<ParsedAttachment[]>([]);
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const [briefSections, setBriefSections] = useState<{ question: string; answer: string }[]>([]);
  const { teamMembers } = useTeamMembers();

  useEffect(() => {
    if (request) {
      setNewStatus(request.status);
      setNewAssignee(request.assigned_to || "unassigned");
      parseDescription(request.description);
    }
  }, [request]);

  const parseDescription = (description: string | null) => {
    if (!description) {
      setBriefSections([]);
      setAttachments([]);
      return;
    }

    const sections: { question: string; answer: string }[] = [];
    const parsedAttachments: ParsedAttachment[] = [];

    // Split by **question** pattern
    const parts = description.split(/\*\*([^*]+)\*\*/);
    
    let currentQuestion = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      if (i % 2 === 1) {
        // This is a question (was between **)
        currentQuestion = part;
      } else if (currentQuestion) {
        // This is an answer
        if (currentQuestion === "Załączniki:") {
          // Parse attachments
          const lines = part.split("\n").filter((l) => l.trim().startsWith("-"));
          for (const line of lines) {
            const match = line.match(/- ([^(]+) \(([^)]+)\)/);
            if (match) {
              const name = match[1].trim();
              const path = match[2].trim();
              const ext = name.split(".").pop()?.toLowerCase() || "";
              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
              parsedAttachments.push({
                name,
                path,
                type: isImage ? "image" : "document",
              });
            }
          }
        } else {
          sections.push({ question: currentQuestion, answer: part });
        }
        currentQuestion = "";
      }
    }

    setBriefSections(sections);
    setAttachments(parsedAttachments);

    // Load thumbnails for images
    loadThumbnails(parsedAttachments);
  };

  const loadThumbnails = async (parsedAttachments: ParsedAttachment[]) => {
    const imageAttachments = parsedAttachments.filter((a) => a.type === "image");
    const urls: Record<string, string> = {};

    for (const attachment of imageAttachments) {
      try {
        const { data } = await supabase.storage
          .from("project-files")
          .createSignedUrl(attachment.path, 3600);
        if (data?.signedUrl) {
          urls[attachment.path] = data.signedUrl;
        }
      } catch (error) {
        console.error("Error loading thumbnail:", error);
      }
    }

    setThumbnailUrls(urls);
  };

  const handleDownload = async (attachment: ParsedAttachment) => {
    const { data, error } = await supabase.storage
      .from("project-files")
      .download(attachment.path);

    if (error || !data) {
      console.error("Download error:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = () => {
    if (request && newStatus !== request.status) {
      onStatusChange(request.id, newStatus);
    }
  };

  const handleAssigneeUpdate = () => {
    if (request && onAssign) {
      const assignedTo = newAssignee === "unassigned" ? null : newAssignee;
      if (assignedTo !== request.assigned_to) {
        onAssign(request.id, assignedTo);
      }
    }
  };

  if (!request) return null;

  const typeConfig = requestTypeConfig[request.request_type] || requestTypeConfig.other;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {typeConfig.icon}
            <span>{request.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Badge variant={statusConfig[request.status].variant}>
              {statusConfig[request.status].label}
            </Badge>
            <span className={priorityConfig[request.priority].className}>
              Priorytet: {priorityConfig[request.priority].label}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(request.created_at), "d MMMM yyyy, HH:mm", { locale: pl })}
            </span>
          </div>

          {/* Status & Assignment (Team Only) */}
          {isTeamMember && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Status Change */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex gap-2">
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ClientRequest["status"])}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={handleStatusUpdate}
                      disabled={newStatus === request.status}
                    >
                      Zapisz
                    </Button>
                  </div>
                </div>

                {/* Assignment */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5" />
                    Przypisz do
                  </Label>
                  <div className="flex gap-2">
                    <Select value={newAssignee} onValueChange={setNewAssignee}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Wybierz osobę" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">
                          <span className="text-muted-foreground">Nieprzypisane</span>
                        </SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <span className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-xs">
                                  {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              {member.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={handleAssigneeUpdate}
                      disabled={newAssignee === (request.assigned_to || "unassigned")}
                    >
                      Zapisz
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Assignee Display */}
              {request.assigned_member && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {request.assigned_member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Przypisane do: {request.assigned_member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{request.assigned_member.email}</p>
                  </div>
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Brief Content */}
          {briefSections.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Brief zadania
              </h4>
              <div className="space-y-4 rounded-xl border border-border bg-card p-4">
                {briefSections.map((section, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-sm font-medium text-primary">
                      {section.question}
                    </p>
                    <p className="text-foreground whitespace-pre-wrap">
                      {section.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : request.description ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Opis</h4>
              <p className="text-foreground whitespace-pre-wrap rounded-xl border border-border bg-card p-4">
                {request.description}
              </p>
            </div>
          ) : null}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Załączniki ({attachments.length})
              </h4>

              {/* Image Thumbnails */}
              {attachments.some((a) => a.type === "image") && (
                <div className="grid grid-cols-4 gap-3">
                  {attachments
                    .filter((a) => a.type === "image")
                    .map((attachment) => (
                      <div
                        key={attachment.path}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group cursor-pointer"
                        onClick={() => handleDownload(attachment)}
                      >
                        {thumbnailUrls[attachment.path] ? (
                          <img
                            src={thumbnailUrls[attachment.path]}
                            alt={attachment.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/50 transition-colors flex items-center justify-center">
                          <Download className="h-5 w-5 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-1">
                          <p className="text-xs text-foreground truncate">{attachment.name}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Document Files */}
              {attachments.some((a) => a.type !== "image") && (
                <div className="space-y-2">
                  {attachments
                    .filter((a) => a.type !== "image")
                    .map((attachment) => (
                      <div
                        key={attachment.path}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/30 cursor-pointer transition-colors"
                        onClick={() => handleDownload(attachment)}
                      >
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {attachment.name}
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <Separator />
          <RequestComments requestId={request.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestDetailsDialog;
