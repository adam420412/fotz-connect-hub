import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  Newspaper,
  TrendingUp,
  ExternalLink,
  Search,
  Sparkles,
  BarChart3,
  Share2,
  Brain,
  ShoppingCart,
  Palette,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  title: string;
  summary: string;
  category: string;
  relevance_score: number;
  source_url?: string;
  source_name?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  "SEO": <Search className="h-4 w-4" />,
  "Social Media": <Share2 className="h-4 w-4" />,
  "AI": <Brain className="h-4 w-4" />,
  "E-commerce": <ShoppingCart className="h-4 w-4" />,
  "Branding": <Palette className="h-4 w-4" />,
  "Analytics": <BarChart3 className="h-4 w-4" />,
  "Content": <FileText className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  "SEO": "bg-green-500/10 text-green-600 border-green-500/20",
  "Social Media": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "AI": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "E-commerce": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Branding": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "Analytics": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  "Content": "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const MarketingNews = () => {
  const { toast } = useToast();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setNews([]);

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
            messages: [{ role: "user", content: "Wygeneruj 6 najważniejszych aktualności ze świata marketingu." }],
            type: "marketing_news",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch news");
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
        const parsedNews = JSON.parse(jsonMatch[0]);
        setNews(parsedNews);
      } else {
        throw new Error("Could not parse news");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Fallback to mock news
      setNews([
        {
          title: "Google wprowadza AI Overview w wynikach wyszukiwania",
          summary: "Nowa funkcja AI Overview zmienia sposób prezentacji wyników wyszukiwania. Marketerzy muszą dostosować strategie SEO do nowego formatu.",
          category: "AI",
          relevance_score: 9,
        },
        {
          title: "Instagram testuje nowy format Stories dla firm",
          summary: "Meta wprowadza rozszerzone opcje interaktywne w Stories, w tym ankiety produktowe i bezpośrednie zakupy bez opuszczania aplikacji.",
          category: "Social Media",
          relevance_score: 8,
        },
        {
          title: "Wzrost znaczenia video marketingu w B2B",
          summary: "Badania pokazują 40% wzrost konwersji przy użyciu video w kampaniach B2B. LinkedIn i YouTube pozostają kluczowymi platformami.",
          category: "Content",
          relevance_score: 8,
        },
        {
          title: "Nowe wytyczne Google dotyczące E-E-A-T",
          summary: "Google aktualizuje wytyczne jakości treści, kładąc większy nacisk na doświadczenie autora i oryginalność contentu.",
          category: "SEO",
          relevance_score: 9,
        },
        {
          title: "TikTok Shop rozszerza działalność w Europie",
          summary: "Platforma e-commerce TikToka wchodzi na nowe rynki, oferując markom bezpośrednią sprzedaż przez aplikację.",
          category: "E-commerce",
          relevance_score: 7,
        },
        {
          title: "Automatyzacja marketingu z wykorzystaniem AI",
          summary: "Nowe narzędzia AI umożliwiają automatyzację personalizacji kampanii w czasie rzeczywistym, zwiększając ROI o średnio 25%.",
          category: "AI",
          relevance_score: 8,
        },
      ]);
      toast({
        title: "Użyto przykładowych danych",
        description: "Wygenerowano przykładowe wiadomości marketingowe",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = selectedCategory
    ? news.filter((item) => item.category === selectedCategory)
    : news;

  const categories = [...new Set(news.map((item) => item.category))];

  return (
    <DashboardLayout title="Newsy Marketingowe" userRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-fotz">
              <Newspaper className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Trendy i aktualności</h2>
              <p className="text-sm text-muted-foreground">Najważniejsze wiadomości ze świata marketingu</p>
            </div>
          </div>
          <Button variant="gradient" onClick={fetchNews} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isLoading ? "Pobieranie..." : "Odśwież wiadomości"}
          </Button>
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Wszystkie
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="gap-2"
              >
                {categoryIcons[category]}
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* News Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNews.map((item, index) => (
              <div
                key={index}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className={cn("gap-1", categoryColors[item.category] || "bg-muted")}
                  >
                    {categoryIcons[item.category]}
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium text-accent">{item.relevance_score}/10</span>
                  </div>
                </div>

                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{item.summary}</p>

                {item.source_url && (
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {item.source_name || "Czytaj więcej"}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredNews.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">Brak wiadomości</h3>
            <p className="text-muted-foreground">Kliknij przycisk, aby pobrać najnowsze wiadomości</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarketingNews;
