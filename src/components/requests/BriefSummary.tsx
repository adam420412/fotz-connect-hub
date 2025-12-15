import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Loader2, Edit2 } from "lucide-react";
import { BriefConfig } from "./briefConfig";

interface BriefSummaryProps {
  config: BriefConfig;
  answers: Record<string, string>;
  title: string;
  priority: string;
  isSubmitting: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const priorityLabels: Record<string, string> = {
  low: "Niski",
  normal: "Normalny",
  high: "Wysoki",
  urgent: "Pilny",
};

const BriefSummary = ({
  config,
  answers,
  title,
  priority,
  isSubmitting,
  onEdit,
  onSubmit,
  onBack,
}: BriefSummaryProps) => {
  const answeredQuestions = config.questions.filter(
    (q) => answers[q.id] && answers[q.id].trim()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Podsumowanie briefu</h3>
        <p className="text-sm text-muted-foreground">
          Sprawdź poprawność informacji przed wysłaniem
        </p>
      </div>

      {/* Summary Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-h-[400px] overflow-y-auto">
        {/* Title & Priority */}
        <div className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tytuł zadania</p>
              <p className="font-medium text-foreground">{title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Priorytet</p>
              <p className="font-medium text-foreground">{priorityLabels[priority]}</p>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-4">
          {answeredQuestions.map((question) => (
            <div key={question.id} className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {question.question}
              </p>
              <p className="text-foreground whitespace-pre-wrap">
                {answers[question.id]}
              </p>
            </div>
          ))}
        </div>

        {answeredQuestions.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            Brak uzupełnionych odpowiedzi
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Wstecz
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edytuj
          </Button>
          <Button
            variant="gradient"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Send className="h-4 w-4" />
            Wyślij zadanie
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BriefSummary;
