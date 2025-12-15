import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  MessageSquare,
  FileText,
  CheckSquare,
  Send,
  Clock,
  Loader2,
  ClipboardList,
  Paperclip,
  Eye,
} from "lucide-react";
import { useClientRequests, CreateRequestData, ClientRequest } from "@/hooks/useClientRequests";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { briefConfigs, formatBriefAnswers } from "@/components/requests/briefConfig";
import BriefQuiz from "@/components/requests/BriefQuiz";
import BriefSummary from "@/components/requests/BriefSummary";
import BriefAttachments, { BriefAttachment } from "@/components/requests/BriefAttachments";
import RequestDetailsDialog from "@/components/requests/RequestDetailsDialog";

const requestTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  task: { label: "Nowe zadanie", icon: <CheckSquare className="h-4 w-4" /> },
  feedback: { label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
  comment: { label: "Komentarz do pliku", icon: <FileText className="h-4 w-4" /> },
  other: { label: "Inne", icon: <Send className="h-4 w-4" /> },
};

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
  urgent: { label: "Pilny", className: "text-destructive" },
};

type DialogStep = "type_select" | "brief_quiz" | "summary";

const NewRequest = () => {
  const { requests, isLoading, createRequest, updateRequest, isCreating } = useClientRequests();
  const { files } = useProjectFiles();
  const { role } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<DialogStep>("type_select");
  const [selectedRequest, setSelectedRequest] = useState<ClientRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isTeamMember = role && ["admin", "manager", "employee"].includes(role);

  // Form state
  const [formType, setFormType] = useState<CreateRequestData["request_type"]>("task");
  const [formTitle, setFormTitle] = useState("");
  const [formPriority, setFormPriority] = useState<CreateRequestData["priority"]>("normal");
  const [formFileId, setFormFileId] = useState<string>("");
  const [briefAnswers, setBriefAnswers] = useState<Record<string, string>>({});
  const [briefAttachments, setBriefAttachments] = useState<BriefAttachment[]>([]);

  const resetForm = () => {
    setFormType("task");
    setFormTitle("");
    setFormPriority("normal");
    setFormFileId("");
    setBriefAnswers({});
    setBriefAttachments([]);
    setDialogStep("type_select");
  };

  const handleStartBrief = () => {
    if (!formTitle.trim()) return;
    setDialogStep("brief_quiz");
  };

  const handleBriefComplete = () => {
    setDialogStep("summary");
  };

  const handleSubmit = () => {
    if (!formTitle.trim()) return;

    let formattedBrief = formatBriefAnswers(formType, briefAnswers);

    // Add attachments info to description
    if (briefAttachments.length > 0) {
      const attachmentsInfo = briefAttachments
        .map((a) => `- ${a.name} (${a.storagePath})`)
        .join("\n");
      formattedBrief += `\n\n**Załączniki:**\n${attachmentsInfo}`;
    }

    const data: CreateRequestData = {
      title: formTitle.trim(),
      description: formattedBrief || undefined,
      request_type: formType,
      priority: formPriority,
      related_file_id: formFileId || undefined,
    };

    createRequest(data);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleRequestClick = (request: ClientRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleStatusChange = (id: string, status: ClientRequest["status"]) => {
    updateRequest({ id, status });
    setIsDetailsOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  return (
    <DashboardLayout title="Nowe zadanie">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-fotz">
              <PlusCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Wyślij zadanie do zespołu</h2>
              <p className="text-sm text-muted-foreground">Dodaj nowe zadanie, komentarz lub feedback</p>
            </div>
          </div>

          <Button variant="gradient" onClick={() => setIsDialogOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Nowe zadanie
          </Button>
        </div>

        {/* Request List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <PlusCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Brak wysłanych zadań</h3>
            <p className="text-muted-foreground mb-4">
              Wyślij nowe zadanie do zespołu, aby rozpocząć współpracę
            </p>
            <Button variant="gradient" onClick={() => setIsDialogOpen(true)} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Wyślij pierwsze zadanie
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 cursor-pointer group"
                onClick={() => handleRequestClick(request)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {requestTypeConfig[request.request_type]?.icon}
                      <h3 className="font-medium text-foreground">{request.title}</h3>
                    </div>
                    {request.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {request.description.split("\n")[0]}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant={statusConfig[request.status].variant}>
                        {statusConfig[request.status].label}
                      </Badge>
                      <span className={priorityConfig[request.priority].className}>
                        {priorityConfig[request.priority].label}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(request.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRequestClick(request);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Details Dialog */}
      <RequestDetailsDialog
        request={selectedRequest}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusChange={handleStatusChange}
        isTeamMember={isTeamMember}
      />

      {/* Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {dialogStep === "type_select" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Wyślij zadanie do zespołu
                </DialogTitle>
                <DialogDescription>
                  Wybierz typ zadania i uzupełnij brief, aby zespół dokładnie wiedział co zrobić
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Typ zadania</Label>
                    <Select value={formType} onValueChange={(v) => setFormType(v as CreateRequestData["request_type"])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(requestTypeConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              {config.icon}
                              {config.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priorytet</Label>
                    <Select value={formPriority} onValueChange={(v) => setFormPriority(v as CreateRequestData["priority"])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <span className={config.className}>{config.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tytuł zadania</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Krótki, opisowy tytuł"
                  />
                </div>

                {(formType === "comment" || formType === "feedback") && files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Powiązany plik (opcjonalne)</Label>
                    <Select value={formFileId} onValueChange={setFormFileId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz plik" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Brak</SelectItem>
                        {files.map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Anuluj
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleStartBrief}
                    disabled={!formTitle.trim()}
                    className="gap-2"
                  >
                    Dalej do briefu
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {dialogStep === "brief_quiz" && briefConfigs[formType] && (
            <BriefQuiz
              config={briefConfigs[formType]}
              answers={briefAnswers}
              onAnswersChange={setBriefAnswers}
              attachments={briefAttachments}
              onAttachmentsChange={setBriefAttachments}
              onComplete={handleBriefComplete}
              onBack={() => setDialogStep("type_select")}
            />
          )}

          {dialogStep === "summary" && briefConfigs[formType] && (
            <BriefSummary
              config={briefConfigs[formType]}
              answers={briefAnswers}
              attachments={briefAttachments}
              title={formTitle}
              priority={formPriority}
              isSubmitting={isCreating}
              onEdit={() => setDialogStep("brief_quiz")}
              onSubmit={handleSubmit}
              onBack={() => setDialogStep("brief_quiz")}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default NewRequest;
