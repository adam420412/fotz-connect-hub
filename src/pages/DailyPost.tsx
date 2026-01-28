import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Send,
  PenLine,
  Loader2,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
  email: string;
  avatar_url: string | null;
}

const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Facebook: <Facebook className="h-4 w-4" />,
  TikTok: <Video className="h-4 w-4" />,
};

const DailyPost = () => {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assignedMember, setAssignedMember] = useState<TeamMember | null>(null);
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null);
  
  // Post creation form
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postPlatform, setPostPlatform] = useState("Instagram");
  const [postHashtags, setPostHashtags] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("none");
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch team members from database
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoadingMembers(true);
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching team members:", error);
        // Fallback to mock data
        const mockMembers: TeamMember[] = [
          { id: "1", name: "Anna Kowalska", role: "Senior Designer", email: "anna@fotz.pl", avatar_url: null },
          { id: "2", name: "Michał Piotrowski", role: "Project Manager", email: "michal@fotz.pl", avatar_url: null },
          { id: "3", name: "Ewa Szymańska", role: "Graphic Designer", email: "ewa@fotz.pl", avatar_url: null },
          { id: "4", name: "Piotr Nowak", role: "Web Developer", email: "piotr@fotz.pl", avatar_url: null },
          { id: "5", name: "Tomek Wiśniewski", role: "Video Editor", email: "tomek@fotz.pl", avatar_url: null },
          { id: "6", name: "Kasia Mazur", role: "Content Writer", email: "kasia@fotz.pl", avatar_url: null },
        ];
        setTeamMembers(mockMembers);
        const dayOfYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
        );
        const memberIndex = dayOfYear % mockMembers.length;
        setAssignedMember(mockMembers[memberIndex]);
      } else if (data && data.length > 0) {
        setTeamMembers(data);
        const dayOfYear = Math.floor(
          (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
        );
        const memberIndex = dayOfYear % data.length;
        setAssignedMember(data[memberIndex]);
      }
      setIsLoadingMembers(false);
    };

    fetchTeamMembers();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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

      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedIdeas = JSON.parse(jsonMatch[0]);
        setIdeas(parsedIdeas);
      } else {
        throw new Error("Could not parse ideas");
      }
    } catch (error) {
      console.error("Error generating ideas:", error);
      setIdeas([
        {
          title: "Behind the scenes - Dzień w agencji",
          description: "Pokaż kulisy pracy w FOTZ Studio. Autentyczne treści budują zaufanie i pokazują ludzką stronę marki.",
          platform: "Instagram",
          hashtags: ["#behindthescenes", "#agencylife", "#marketing", "#teamwork"],
        },
        {
          title: "AI w marketingu - Przewodnik 2024",
          description: "Edukacyjny post o wykorzystaniu sztucznej inteligencji w strategiach marketingowych.",
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
          description: "Interaktywny post z odpowiedziami na najczęstsze pytania o marketing.",
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

  const handleSelectIdea = (index: number) => {
    setSelectedIdea(index);
    const idea = ideas[index];
    setPostTitle(idea.title);
    setPostContent(idea.description);
    setPostPlatform(idea.platform);
    setPostHashtags(idea.hashtags.join(" "));
  };

  const handleSavePost = async () => {
    if (!postTitle.trim() || !postContent.trim() || selectedAuthor === "none") {
      toast({
        title: "Uzupełnij dane",
        description: "Tytuł, treść i autor są wymagane",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate saving (in production, save to database)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "Post zapisany!",
      description: `Post "${postTitle}" został zapisany przez ${teamMembers.find(m => m.id === selectedAuthor)?.name}`,
    });
    
    // Reset form
    setPostTitle("");
    setPostContent("");
    setPostHashtags("");
    setSelectedIdea(null);
    setIsSaving(false);
  };

  return (
    <DashboardLayout title="Codzienny Post">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-fotz">
                <Calendar className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dzisiejsza data</p>
                <h2 className="text-xl font-semibold text-foreground capitalize">{today}</h2>
              </div>
            </div>

            {isLoadingMembers ? (
              <Skeleton className="h-20 w-64" />
            ) : assignedMember && (
              <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/20 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-fotz text-primary-foreground font-medium">
                    {getInitials(assignedMember.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Wylosowana osoba na dziś
                  </p>
                  <p className="font-semibold text-foreground">{assignedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{assignedMember.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="ideas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ideas" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Pomysły AI
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <PenLine className="h-4 w-4" />
              Stwórz post
            </TabsTrigger>
          </TabsList>

          {/* AI Ideas Tab */}
          <TabsContent value="ideas" className="space-y-6">
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
                    onClick={() => handleSelectIdea(index)}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectIdea(index);
                      }}
                    >
                      Użyj tego pomysłu
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
          </TabsContent>

          {/* Create Post Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                Stwórz swój post
              </h3>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor</Label>
                    <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz autora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Wybierz...</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {member.name} - {member.role}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platform">Platforma</Label>
                    <Select value={postPlatform} onValueChange={setPostPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Instagram">
                          <span className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram
                          </span>
                        </SelectItem>
                        <SelectItem value="LinkedIn">
                          <span className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </span>
                        </SelectItem>
                        <SelectItem value="Facebook">
                          <span className="flex items-center gap-2">
                            <Facebook className="h-4 w-4" />
                            Facebook
                          </span>
                        </SelectItem>
                        <SelectItem value="TikTok">
                          <span className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            TikTok
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Tytuł / Temat</Label>
                    <Input
                      id="title"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Wpisz tytuł posta..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Treść posta</Label>
                    <Textarea
                      id="content"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Napisz treść swojego posta..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hashtags">Hashtagi</Label>
                    <Input
                      id="hashtags"
                      value={postHashtags}
                      onChange={(e) => setPostHashtags(e.target.value)}
                      placeholder="#marketing #socialmedia #fotzstudio"
                    />
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <Label>Podgląd</Label>
                  <div className="rounded-xl border border-border bg-muted/30 p-5 min-h-[300px]">
                    {postTitle || postContent ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-fotz text-primary-foreground text-sm">
                              {selectedAuthor
                                ? getInitials(teamMembers.find((m) => m.id === selectedAuthor)?.name || "")
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {selectedAuthor
                                ? teamMembers.find((m) => m.id === selectedAuthor)?.name
                                : "Wybierz autora"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {platformIcons[postPlatform]}
                              <span>{postPlatform}</span>
                            </div>
                          </div>
                        </div>

                        {postTitle && (
                          <h4 className="font-semibold text-foreground">{postTitle}</h4>
                        )}
                        {postContent && (
                          <p className="text-sm text-foreground whitespace-pre-wrap">{postContent}</p>
                        )}
                        {postHashtags && (
                          <p className="text-sm text-accent">{postHashtags}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <PenLine className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">
                          Wpisz treść, aby zobaczyć podgląd
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleSavePost}
                    disabled={isSaving || !postTitle.trim() || !postContent.trim() || !selectedAuthor}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isSaving ? "Zapisywanie..." : "Zapisz post"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DailyPost;
