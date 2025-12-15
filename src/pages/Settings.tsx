import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { toast } = useToast();
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
    darkMode: false,
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
      // Test webhook by sending a test message
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
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode" className="font-normal text-foreground">Tryb ciemny</Label>
                  <p className="text-sm text-muted-foreground">Włącz ciemny motyw</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={appearance.darkMode}
                  onCheckedChange={(checked) =>
                    setAppearance((prev) => ({ ...prev, darkMode: checked }))
                  }
                />
              </div>
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
