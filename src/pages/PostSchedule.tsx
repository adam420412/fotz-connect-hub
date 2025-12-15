import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarDays,
  Plus,
  Instagram,
  Linkedin,
  Facebook,
  Video,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Edit,
  Building2,
  Users,
  Clock,
  Check,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { pl } from "date-fns/locale";
import { useScheduledPosts, ScheduledPost, CreatePostData, getClientsFromPosts } from "@/hooks/useScheduledPosts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const platformIcons: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="h-4 w-4" />,
  LinkedIn: <Linkedin className="h-4 w-4" />,
  Facebook: <Facebook className="h-4 w-4" />,
  TikTok: <Video className="h-4 w-4" />,
};

const platformColors: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  LinkedIn: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Facebook: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  TikTok: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  scheduled: { label: "Zaplanowany", variant: "outline" },
  published: { label: "Opublikowany", variant: "default" },
  draft: { label: "Roboczy", variant: "secondary" },
};

const PostSchedule = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPlatform, setFormPlatform] = useState("Instagram");
  const [formHashtags, setFormHashtags] = useState("");
  const [formDate, setFormDate] = useState<Date | undefined>(undefined);
  const [formTime, setFormTime] = useState("");
  const [formClient, setFormClient] = useState<string>("agency");
  const [formStatus, setFormStatus] = useState<"scheduled" | "draft">("scheduled");

  const { posts, isLoading, createPost, updatePost, deletePost, isCreating } = useScheduledPosts(
    clientFilter === "all" ? undefined : clientFilter === "agency" ? "agency" : clientFilter
  );

  // Fetch all posts to get client list
  const { data: allPosts = [] } = useQuery({
    queryKey: ["scheduled-posts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*");
      if (error) throw error;
      return data as ScheduledPost[];
    },
  });

  const clients = useMemo(() => getClientsFromPosts(allPosts), [allPosts]);

  // Calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get posts for a specific day
  const getPostsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return posts.filter((post) => post.scheduled_date === dateStr);
  };

  // Selected day posts
  const selectedDayPosts = selectedDate ? getPostsForDay(selectedDate) : [];

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormPlatform("Instagram");
    setFormHashtags("");
    setFormDate(undefined);
    setFormTime("");
    setFormClient("agency");
    setFormStatus("scheduled");
    setEditingPost(null);
  };

  const openCreateDialog = (date?: Date) => {
    resetForm();
    if (date) {
      setFormDate(date);
    }
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (post: ScheduledPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormPlatform(post.platform);
    setFormHashtags(post.hashtags || "");
    setFormDate(new Date(post.scheduled_date));
    setFormTime(post.scheduled_time || "");
    setFormClient(post.client_name || "agency");
    setFormStatus(post.status as "scheduled" | "draft");
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formTitle.trim() || !formContent.trim() || !formDate) return;

    const postData: CreatePostData = {
      title: formTitle.trim(),
      content: formContent.trim(),
      platform: formPlatform,
      hashtags: formHashtags.trim() || undefined,
      scheduled_date: format(formDate, "yyyy-MM-dd"),
      scheduled_time: formTime || undefined,
      status: formStatus,
      client_name: formClient === "agency" ? null : formClient,
    };

    if (editingPost) {
      updatePost({ id: editingPost.id, ...postData });
    } else {
      createPost(postData);
    }

    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten post?")) {
      deletePost(id);
    }
  };

  return (
    <DashboardLayout title="Harmonogram Postów" userRole="manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-fotz">
              <CalendarDays className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Kalendarz publikacji</h2>
              <p className="text-sm text-muted-foreground">Planuj posty dla klientów i agencji</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Wszystkie
                  </span>
                </SelectItem>
                <SelectItem value="agency">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    FOTZ Studio
                  </span>
                </SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="gradient" onClick={() => openCreateDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nowy post
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {format(currentMonth, "LLLL yyyy", { locale: pl })}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month start */}
                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {calendarDays.map((day) => {
                  const dayPosts = getPostsForDay(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square rounded-lg border p-1 text-left transition-all hover:border-primary/50",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-transparent hover:bg-muted/50",
                        isToday(day) && "bg-accent/10"
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isToday(day) ? "text-accent" : "text-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayPosts.length > 0 && (
                          <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                            {dayPosts.slice(0, 3).map((post, i) => (
                              <div
                                key={post.id}
                                className={cn(
                                  "h-1.5 rounded-full",
                                  post.platform === "Instagram" && "bg-pink-500",
                                  post.platform === "LinkedIn" && "bg-blue-500",
                                  post.platform === "Facebook" && "bg-indigo-500",
                                  post.platform === "TikTok" && "bg-gray-500"
                                )}
                              />
                            ))}
                            {dayPosts.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{dayPosts.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Day Posts */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                {selectedDate
                  ? format(selectedDate, "d MMMM yyyy", { locale: pl })
                  : "Wybierz dzień"}
              </h3>
              {selectedDate && (
                <Button variant="ghost" size="sm" onClick={() => openCreateDialog(selectedDate)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Dodaj
                </Button>
              )}
            </div>

            {!selectedDate ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Kliknij na dzień w kalendarzu</p>
              </div>
            ) : selectedDayPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Brak zaplanowanych postów</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => openCreateDialog(selectedDate)}
                >
                  <Plus className="h-4 w-4" />
                  Zaplanuj post
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedDayPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-border p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("gap-1", platformColors[post.platform])}>
                          {platformIcons[post.platform]}
                          {post.platform}
                        </Badge>
                        <Badge variant={statusConfig[post.status].variant}>
                          {statusConfig[post.status].label}
                        </Badge>
                      </div>
                    </div>

                    <h4 className="font-medium text-foreground text-sm mb-1">{post.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>

                    {post.client_name && (
                      <p className="text-xs text-accent mb-2">Klient: {post.client_name}</p>
                    )}
                    {!post.client_name && (
                      <p className="text-xs text-primary mb-2">FOTZ Studio</p>
                    )}

                    {post.scheduled_time && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.scheduled_time}
                      </p>
                    )}

                    <div className="flex gap-1 mt-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(post)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(post.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edytuj post" : "Zaplanuj nowy post"}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Zaktualizuj szczegóły posta" : "Wypełnij formularz, aby zaplanować post"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Klient</Label>
                <Select value={formClient} onValueChange={setFormClient}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agency">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        FOTZ Studio
                      </span>
                    </SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                    <SelectItem value="new_client">
                      <span className="text-muted-foreground">+ Nowy klient...</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platforma</Label>
                <Select value={formPlatform} onValueChange={setFormPlatform}>
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
            </div>

            {formClient === "new_client" && (
              <div className="space-y-2">
                <Label>Nazwa nowego klienta</Label>
                <Input
                  placeholder="Wpisz nazwę klienta"
                  onChange={(e) => setFormClient(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Tytuł</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Tytuł posta"
              />
            </div>

            <div className="space-y-2">
              <Label>Treść</Label>
              <Textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Treść posta..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Hashtagi</Label>
              <Input
                value={formHashtags}
                onChange={(e) => setFormHashtags(e.target.value)}
                placeholder="#marketing #socialmedia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data publikacji</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formDate ? format(formDate, "d MMM yyyy", { locale: pl }) : "Wybierz datę"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formDate}
                      onSelect={setFormDate}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Godzina (opcjonalnie)</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as "scheduled" | "draft")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Zaplanowany
                    </span>
                  </SelectItem>
                  <SelectItem value="draft">
                    <span className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Roboczy
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Anuluj
              </Button>
              <Button
                variant="gradient"
                onClick={handleSubmit}
                disabled={!formTitle.trim() || !formContent.trim() || !formDate || isCreating}
                className="gap-2"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingPost ? "Zapisz zmiany" : "Zaplanuj post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PostSchedule;
