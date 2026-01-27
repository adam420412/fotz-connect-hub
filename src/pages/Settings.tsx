import { useState } from "react";
import { useTheme } from "next-themes";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CategoryManagement } from "@/components/settings/CategoryManagement";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  User,
  Bell,
  Palette,
  Shield,
  Link2,
  Slack,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Tag,
  Sun,
  Moon,
  Monitor,
  Command,
  Calendar,
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuthContext();
  const googleCalendar = useGoogleCalendar(user?.id);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackConnected, setSlackConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [notifications, setNotifications] = useState({
    emailNewTask: true,
    emailFileApproval: true,
    emailComments: false,
    slackNewTask: false,
    slackFileApproval: false,
    slackComments: false,
  });

  const [appearance, setAppearance] = useState({
    compactView: false,
  });

  const handleSlackConnect = async () => {
    if (!slackWebhook.includes("hooks.slack.com")) {
      toast({
        title: "Błąd",
        description: "Proszę podać prawidłowy webhook URL Slack",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      await fetch(slackWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🎉 FOTZ Studio Portal został połączony ze Slackiem!",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "*FOTZ Studio Portal*\n✅ Integracja ze Slackiem została skonfigurowana pomyślnie!"
              }
            }
          ]
        }),
      });

      setSlackConnected(true);
      setNotifications(prev => ({
        ...prev,
        slackNewTask: true,
        slackFileApproval: true,
      }));
      
      toast({
        title: "Połączono ze Slackiem",
        description: "Powiadomienia będą wysyłane na Twój kanał Slack",
      });
    } catch (error) {
      console.error("Slack connection error:", error);
      toast({
        title: "Wysłano żądanie",
        description: "Sprawdź kanał Slack, aby potwierdzić połączenie",
      });
      setSlackConnected(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSlackDisconnect = () => {
    setSlackConnected(false);
    setSlackWebhook("");
    setNotifications(prev => ({
      ...prev,
      slackNewTask: false,
      slackFileApproval: false,
      slackComments: false,
    }));
    toast({
      title: "Rozłączono ze Slackiem",
      description: "Integracja została wyłączona",
    });
  };

  return (
    <DashboardLayout title="Ustawienia">
      <div className="max-w-3xl space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Profil</h2>
              <p className="text-sm text-muted-foreground">Zarządzaj swoimi danymi</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko</Label>
                <Input id="name" defaultValue="Jan Kowalski" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="jan@fotz.pl" />
              </div>
            </div>
            <Button variant="gradient">Zapisz zmiany</Button>
          </div>
        </section>

        <Separator />

        {/* Appearance */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Palette className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wygląd</h2>
              <p className="text-sm text-muted-foreground">Dostosuj interfejs</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-foreground">Motyw</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun className="h-6 w-6" />
                  <span className="text-sm font-medium">Jasny</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon className="h-6 w-6" />
                  <span className="text-sm font-medium">Ciemny</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-sm font-medium">Systemowy</span>
                </button>
              </div>
            </div>

            {/* Keyboard Shortcut Info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Command className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Wyszukiwarka globalna</p>
                  <p className="text-xs text-muted-foreground">Szybkie wyszukiwanie w całym systemie</p>
                </div>
              </div>
              <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-background border border-border rounded">
                ⌘K
              </kbd>
            </div>

            {/* Compact View */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact" className="font-normal text-foreground">Widok kompaktowy</Label>
                <p className="text-sm text-muted-foreground">Zmniejsz odstępy</p>
              </div>
              <Switch
                id="compact"
                checked={appearance.compactView}
                onCheckedChange={(checked) =>
                  setAppearance((prev) => ({ ...prev, compactView: checked }))
                }
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Categories Management */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Tag className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Kategorie zadań</h2>
              <p className="text-sm text-muted-foreground">Zarządzaj kategoriami i tagami</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <CategoryManagement />
          </div>
        </section>

        <Separator />

        {/* Slack Integration */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4A154B]/10">
              <Slack className="h-5 w-5 text-[#4A154B]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Integracja Slack</h2>
              <p className="text-sm text-muted-foreground">Otrzymuj powiadomienia na Slacku</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {slackConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Połączono ze Slackiem</p>
                    <p className="text-sm text-muted-foreground">Powiadomienia są aktywne</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSlackDisconnect}>
                    Rozłącz
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Powiadomienia Slack</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack-task" className="font-normal text-foreground">Nowe zadania</Label>
                      <Switch
                        id="slack-task"
                        checked={notifications.slackNewTask}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, slackNewTask: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack-file" className="font-normal text-foreground">Akceptacje plików</Label>
                      <Switch
                        id="slack-file"
                        checked={notifications.slackFileApproval}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, slackFileApproval: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="slack-comment" className="font-normal text-foreground">Komentarze</Label>
                      <Switch
                        id="slack-comment"
                        checked={notifications.slackComments}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({ ...prev, slackComments: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">
                      Aby skonfigurować integrację, utwórz webhook w Slack:
                    </p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                      <li>Przejdź do ustawień aplikacji Slack</li>
                      <li>Wybierz "Incoming Webhooks"</li>
                      <li>Utwórz nowy webhook i wybierz kanał</li>
                      <li>Skopiuj URL i wklej poniżej</li>
                    </ol>
                    <a
                      href="https://api.slack.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                    >
                      Otwórz Slack API <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slack-webhook">Webhook URL</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                  />
                </div>
                <Button
                  variant="gradient"
                  onClick={handleSlackConnect}
                  disabled={!slackWebhook || isConnecting}
                  className="gap-2"
                >
                  {isConnecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Łączenie...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Połącz ze Slackiem
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Google Calendar Integration */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Google Calendar</h2>
              <p className="text-sm text-muted-foreground">Synchronizuj zadania i wydarzenia</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            {googleCalendar.isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Ładowanie...
              </div>
            ) : googleCalendar.isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Połączono z Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      {googleCalendar.integration?.last_sync_at
                        ? `Ostatnia synchronizacja: ${new Date(googleCalendar.integration.last_sync_at).toLocaleString("pl-PL")}`
                        : "Oczekuje na pierwszą synchronizację"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={googleCalendar.disconnect}>
                    Rozłącz
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gcal-sync" className="font-normal text-foreground">
                      Automatyczna synchronizacja
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Synchronizuj zadania i wydarzenia z kalendarzem
                    </p>
                  </div>
                  <Switch
                    id="gcal-sync"
                    checked={googleCalendar.integration?.sync_enabled ?? true}
                    onCheckedChange={(checked) => googleCalendar.toggleSync(checked)}
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-sm font-medium text-foreground">Co jest synchronizowane:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Przypisane zadania z deadline'ami</li>
                    <li>• Wydarzenia zespołowe (urlopy, spotkania)</li>
                    <li>• Przypomnienia 24h i 1h przed terminem</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Synchronizacja dwukierunkowa</p>
                    <p className="text-xs text-muted-foreground">
                      Pobierz zmiany wprowadzone w Google Calendar
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={googleCalendar.syncFromGoogle}
                    disabled={!googleCalendar.integration?.sync_enabled}
                  >
                    Synchronizuj teraz
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">
                      Połącz swoje konto Google, aby synchronizować:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Zadania z terminami do kalendarza</li>
                      <li>Wydarzenia zespołowe i urlopy</li>
                      <li>Automatyczne przypomnienia</li>
                    </ul>
                  </div>
                </div>
                
                <Button
                  variant="gradient"
                  onClick={googleCalendar.connect}
                  disabled={googleCalendar.isConnecting}
                  className="gap-2"
                >
                  {googleCalendar.isConnecting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Łączenie...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Połącz z Google Calendar
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Email Notifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Bell className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Powiadomienia email</h2>
              <p className="text-sm text-muted-foreground">Wybierz co chcesz otrzymywać</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-task" className="font-normal text-foreground">Nowe zadania</Label>
                <Switch
                  id="email-task"
                  checked={notifications.emailNewTask}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, emailNewTask: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-file" className="font-normal text-foreground">Pliki do akceptacji</Label>
                <Switch
                  id="email-file"
                  checked={notifications.emailFileApproval}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, emailFileApproval: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-comment" className="font-normal text-foreground">Nowe komentarze</Label>
                <Switch
                  id="email-comment"
                  checked={notifications.emailComments}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, emailComments: checked }))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Security */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Shield className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bezpieczeństwo</h2>
              <p className="text-sm text-muted-foreground">Zarządzaj hasłem</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Aktualne hasło</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nowe hasło</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potwierdź hasło</Label>
                <Input id="confirm-password" type="password" />
              </div>
            </div>
            <Button variant="outline">Zmień hasło</Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
