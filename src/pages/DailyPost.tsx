import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  RefreshCw,
  Instagram,
  Linkedin,
  Facebook,
  Video,
  Check,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PostIdea {
  title: string;
  description: string;
  platform: string;
  hashtags: string[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

const mockTeamMembers: TeamMember[] = [
  { id: "1", name: "Anna Kowalska", role: "Senior Designer", initials: "AK" },
  { id: "2", name: "Michał Piotrowski", role: "Project Manager", initials: "MP" },
  { id: "3", name: "Ewa Szymańska", role: "Graphic Designer", initials: "ES" },
  { id: "4", name: "Piotr Nowak", role: "Web Developer", initials: "PN" },
  { id: "5", name: "Tomek Wiśniewski", role: "Video Editor", initials: "TW" },
  { id: "6", name: "Kasia Mazur", role: "Content Writer", initials: "KM" },
];

const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Facebook: <Facebook className="h-4 w-4" />,
  TikTok: <Video className="h-4 w-4" />,
};

const DailyPost = () => {
  const { toast } = useToast();
  const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);

  // Get today's date for display
  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Pick a random team member based on today's date
  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const memberIndex = dayOfYear % mockTeamMembers.length;
    setAssignedMember(mockTeamMembers[memberIndex]);
  }, []);

  const generateIdeas = async () => {
    setIsLoading(true);
    setIdeas([]);
    setSelectedIdea(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Wygeneruj 5 pomysłów na posty zgodnie z aktualnymi trendami marketingowymi." }],
            type: "post_ideas",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate ideas");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
              } catch {}
            }
          }
        }
      }

      // Try to parse JSON from the response
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedIdeas = JSON.parse(jsonMatch[0]);
        setIdeas(parsedIdeas);
      } else {
        throw new Error("Could not parse ideas");
      }
    } catch (error) {
      console.error("Error generating ideas:", error);
      // Fallback to mock ideas
      setIdeas([
        {
          title: "Behind the scenes - Dzień w agencji",
          description: "Pokaż kulisy pracy w FOTZ Studio. Autentyczne treści budują zaufanie i pokazują ludzką stronę marki.",
          platform: "Instagram",
          hashtags: ["#behindthescenes", "#agencylife", "#marketing", "#teamwork"],
        },
        {
          title: "AI w marketingu - Przewodnik 2024",
          description: "Edukacyjny post o wykorzystaniu sztucznej inteligencji w strategiach marketingowych. Pozycjonuje nas jako ekspertów.",
          platform: "LinkedIn",
          hashtags: ["#AI", "#MarketingTrends", "#DigitalMarketing"],
        },
        {
          title: "Case study - Sukces klienta",
          description: "Przedstaw konkretne wyniki kampanii dla klienta. Liczby i efekty przyciągają potencjalnych klientów.",
          platform: "LinkedIn",
          hashtags: ["#CaseStudy", "#Results", "#MarketingSuccess"],
        },
        {
          title: "Trendy w social media na 2024",
          description: "Krótkie wideo z 5 najważniejszymi trendami. Format idealny dla TikToka i Reels.",
          platform: "TikTok",
          hashtags: ["#SocialMediaTips", "#Trends2024", "#MarketingTips"],
        },
        {
          title: "Q&A - Odpowiadamy na pytania",
          description: "Interaktywny post z odpowiedziami na najczęstsze pytania o marketing. Buduje zaangażowanie społeczności.",
          platform: "Instagram",
          hashtags: ["#QandA", "#AskUs", "#MarketingAdvice"],
        },
      ]);
      toast({
        title: "Użyto przykładowych pomysłów",
        description: "Wygenerowano przykładowe pomysły na posty",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout title="Codzienny Post" userRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-fotz">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dzisiejsza data</p>
                <h2 className="text-xl font-semibold text-foreground capitalize">{today}</h2>
              </div>
            </div>

            {assignedMember && (
              <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-fotz text-primary-foreground font-medium">
                    {assignedMember.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Wylosowana osoba</p>
                  <p className="font-semibold text-foreground">{assignedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{assignedMember.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Pomysły na posty</h3>
          <Button variant="gradient" onClick={generateIdeas} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? "Generowanie..." : "Generuj pomysły AI"}
          </Button>
        </div>

        {/* Ideas Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : ideas.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea, index) => (
              <div
                key={index}
                onClick={() => setSelectedIdea(index)}
                className={cn(
                  "cursor-pointer rounded-xl border bg-card p-5 transition-all hover:shadow-md",
                  selectedIdea === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-foreground">{idea.title}</h4>
                  {selectedIdea === index && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{idea.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  {platformIcons[idea.platform] || <User className="h-4 w-4" />}
                  <Badge variant="secondary">{idea.platform}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {idea.hashtags.map((tag, i) => (
                    <span key={i} className="text-xs text-accent">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Brak pomysłów</h3>
            <p className="text-muted-foreground mb-4">
              Kliknij przycisk powyżej, aby wygenerować pomysły na posty
            </p>
          </div>
        )}

        {/* Action */}
        {selectedIdea !== null && (
          <div className="flex justify-end">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => {
                toast({
                  title: "Post zaplanowany",
                  description: `Pomysł "${ideas[selectedIdea].title}" został zapisany`,
                });
              }}
            >
              Zatwierdź wybrany pomysł
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DailyPost;
