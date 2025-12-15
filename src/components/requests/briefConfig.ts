export interface BriefQuestion {
  id: string;
  question: string;
  type: "text" | "textarea" | "select" | "multiselect" | "date";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface BriefConfig {
  title: string;
  description: string;
  questions: BriefQuestion[];
}

export const briefConfigs: Record<string, BriefConfig> = {
  task: {
    title: "Brief nowego zadania",
    description: "Uzupełnij poniższe informacje, aby zespół mógł precyzyjnie zrealizować Twoje zlecenie",
    questions: [
      {
        id: "objective",
        question: "Jaki jest główny cel tego zadania?",
        type: "textarea",
        placeholder: "Opisz co chcesz osiągnąć...",
        required: true,
      },
      {
        id: "deliverables",
        question: "Co dokładnie ma powstać? (np. grafika, post, film)",
        type: "text",
        placeholder: "np. 3 grafiki do social media, 1 reel",
        required: true,
      },
      {
        id: "target_audience",
        question: "Do kogo kierowany jest ten materiał?",
        type: "text",
        placeholder: "np. młode kobiety 25-35, przedsiębiorcy B2B",
        required: false,
      },
      {
        id: "tone",
        question: "Jaki ton komunikacji preferujesz?",
        type: "select",
        options: ["Profesjonalny", "Przyjazny/Casualowy", "Elegancki", "Dynamiczny/Energetyczny", "Humorystyczny", "Inny"],
        required: false,
      },
      {
        id: "references",
        question: "Czy masz referencje lub inspiracje? (linki, opisy)",
        type: "textarea",
        placeholder: "Wklej linki lub opisz inspiracje...",
        required: false,
      },
      {
        id: "deadline",
        question: "Kiedy potrzebujesz gotowy materiał?",
        type: "date",
        required: true,
      },
      {
        id: "budget_info",
        question: "Czy są ograniczenia budżetowe lub czasowe?",
        type: "text",
        placeholder: "np. max 2h pracy, budżet na reklamę 500zł",
        required: false,
      },
      {
        id: "additional_notes",
        question: "Dodatkowe uwagi lub wymagania",
        type: "textarea",
        placeholder: "Cokolwiek co pomoże w realizacji...",
        required: false,
      },
    ],
  },
  feedback: {
    title: "Brief feedbacku",
    description: "Opisz szczegółowo swoje uwagi i sugestie",
    questions: [
      {
        id: "feedback_subject",
        question: "Czego dotyczy Twój feedback?",
        type: "select",
        options: ["Grafika/Design", "Treść/Copy", "Strategia", "Kampania reklamowa", "Ogólna współpraca", "Inne"],
        required: true,
      },
      {
        id: "what_works",
        question: "Co Ci się podoba / co działa dobrze?",
        type: "textarea",
        placeholder: "Opisz elementy, które chcesz zachować...",
        required: false,
      },
      {
        id: "what_to_change",
        question: "Co wymaga zmiany lub poprawy?",
        type: "textarea",
        placeholder: "Opisz konkretne elementy do modyfikacji...",
        required: true,
      },
      {
        id: "expected_result",
        question: "Jaki efekt końcowy oczekujesz?",
        type: "textarea",
        placeholder: "Opisz jak ma wyglądać końcowy rezultat...",
        required: true,
      },
      {
        id: "urgency",
        question: "Jak pilna jest ta zmiana?",
        type: "select",
        options: ["Może poczekać", "W tym tygodniu", "Jak najszybciej", "Na wczoraj!"],
        required: true,
      },
    ],
  },
  comment: {
    title: "Brief komentarza do pliku",
    description: "Opisz swoje uwagi do wybranego pliku",
    questions: [
      {
        id: "comment_type",
        question: "Rodzaj komentarza",
        type: "select",
        options: ["Akceptacja z uwagami", "Prośba o poprawki", "Pytanie/Wątpliwość", "Odrzucenie"],
        required: true,
      },
      {
        id: "specific_location",
        question: "Którego elementu dotyczy komentarz?",
        type: "text",
        placeholder: "np. nagłówek, zdjęcie główne, CTA",
        required: false,
      },
      {
        id: "detailed_feedback",
        question: "Szczegółowy opis uwag",
        type: "textarea",
        placeholder: "Opisz dokładnie co wymaga zmiany i dlaczego...",
        required: true,
      },
      {
        id: "expected_action",
        question: "Czego oczekujesz od zespołu?",
        type: "select",
        options: ["Wprowadzenia poprawek", "Wyjaśnienia", "Alternatywnej propozycji", "Tylko do wiadomości"],
        required: true,
      },
    ],
  },
  other: {
    title: "Brief zapytania",
    description: "Opisz swoje zapytanie lub potrzebę",
    questions: [
      {
        id: "inquiry_type",
        question: "Czego dotyczy Twoje zapytanie?",
        type: "select",
        options: ["Nowy projekt", "Rozszerzenie współpracy", "Pytanie techniczne", "Spotkanie/Konsultacja", "Inne"],
        required: true,
      },
      {
        id: "description",
        question: "Opisz szczegółowo swoją potrzebę",
        type: "textarea",
        placeholder: "Im więcej szczegółów, tym lepiej zrozumiemy Twoje oczekiwania...",
        required: true,
      },
      {
        id: "expected_timeline",
        question: "Kiedy potrzebujesz odpowiedzi/realizacji?",
        type: "text",
        placeholder: "np. w tym tygodniu, do końca miesiąca",
        required: false,
      },
      {
        id: "contact_preference",
        question: "Preferowany sposób kontaktu",
        type: "select",
        options: ["Email", "Telefon", "Spotkanie online", "Spotkanie osobiste", "Przez platformę"],
        required: false,
      },
    ],
  },
};

export const formatBriefAnswers = (
  requestType: string,
  answers: Record<string, string>
): string => {
  const config = briefConfigs[requestType];
  if (!config) return "";

  const lines: string[] = [];
  
  config.questions.forEach((q) => {
    const answer = answers[q.id];
    if (answer && answer.trim()) {
      lines.push(`**${q.question}**`);
      lines.push(answer.trim());
      lines.push("");
    }
  });

  return lines.join("\n");
};
