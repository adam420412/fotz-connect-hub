import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { BriefConfig, BriefQuestion } from "./briefConfig";
import { cn } from "@/lib/utils";

interface BriefQuizProps {
  config: BriefConfig;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onComplete: () => void;
  onBack: () => void;
}

const BriefQuiz = ({
  config,
  answers,
  onAnswersChange,
  onComplete,
  onBack,
}: BriefQuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const questions = config.questions;
  const currentQuestion = questions[currentStep];
  const totalSteps = questions.length;

  const updateAnswer = (value: string) => {
    onAnswersChange({ ...answers, [currentQuestion.id]: value });
  };

  const canProceed = () => {
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    return answer && answer.trim().length > 0;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const renderQuestionInput = (question: BriefQuestion) => {
    const value = answers[question.id] || "";

    switch (question.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder={question.placeholder}
            className="mt-2"
          />
        );
      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder={question.placeholder}
            className="mt-2 min-h-[120px]"
          />
        );
      case "select":
        return (
          <Select value={value} onValueChange={updateAnswer}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Wybierz opcję" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateAnswer(e.target.value)}
            className="mt-2"
          />
        );
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Pytanie {currentStep + 1} z {totalSteps}
          </span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-fotz transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border border-border bg-card p-6 min-h-[200px]">
        <Label className="text-base font-medium">
          {currentQuestion.question}
          {currentQuestion.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        {renderQuestionInput(currentQuestion)}
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-200",
              index === currentStep
                ? "w-6 bg-primary"
                : answers[questions[index].id]
                ? "w-2 bg-primary/50"
                : "w-2 bg-muted"
            )}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-2 pt-2">
        <Button variant="outline" onClick={handlePrev} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Wstecz
        </Button>
        <Button
          variant="gradient"
          onClick={handleNext}
          disabled={!canProceed()}
          className="gap-2"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Zakończ brief
            </>
          ) : (
            <>
              Dalej
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BriefQuiz;
