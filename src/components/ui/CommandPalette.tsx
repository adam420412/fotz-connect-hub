import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Calendar,
  Settings,
  Clock,
  MessageSquare,
  FolderOpen,
  BarChart3,
  Send,
  CalendarDays,
  Sparkles,
  Newspaper,
  UserCog,
  Tag,
} from "lucide-react";
import { useClientRequests } from "@/hooks/useClientRequests";
import { useClients } from "@/hooks/useClients";
import { useProjectFiles } from "@/hooks/useProjectFiles";
import { useTaskCategories } from "@/hooks/useTaskCategories";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Zadania", href: "/requests", icon: CheckSquare },
  { name: "Pliki", href: "/files", icon: FileText },
  { name: "Akceptacje", href: "/approvals", icon: FolderOpen },
  { name: "Zespół", href: "/team", icon: Users },
  { name: "Kalendarz zespołu", href: "/team-calendar", icon: CalendarDays },
  { name: "Harmonogram postów", href: "/schedule", icon: Send },
  { name: "Śledzenie czasu", href: "/time-tracking", icon: Clock },
  { name: "Wiadomości", href: "/messages", icon: MessageSquare },
  { name: "Raporty", href: "/reports", icon: BarChart3 },
  { name: "Dzienny post", href: "/daily-post", icon: Calendar },
  { name: "Asystent AI", href: "/ai-assistant", icon: Sparkles },
  { name: "Wiadomości marketingowe", href: "/marketing-news", icon: Newspaper },
  { name: "Szablony projektów", href: "/templates", icon: FolderOpen },
  { name: "Panel admina", href: "/admin", icon: UserCog },
  { name: "Ustawienia", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { requests } = useClientRequests();
  const clientsQuery = useClients();
  const { files } = useProjectFiles();
  const { categories } = useTaskCategories();
  
  const clients = clientsQuery.data || [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      navigate(href);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Szukaj stron, zadań, plików, klientów..." />
      <CommandList>
        <CommandEmpty>Nie znaleziono wyników.</CommandEmpty>

        <CommandGroup heading="Nawigacja">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleSelect(item.href)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {requests && requests.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Zadania">
              {requests.slice(0, 5).map((request) => (
                <CommandItem
                  key={request.id}
                  onSelect={() => handleSelect(`/requests?task=${request.id}`)}
                  className="gap-2"
                >
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{request.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {request.status}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {files && files.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pliki">
              {files.slice(0, 5).map((file) => (
                <CommandItem
                  key={file.id}
                  onSelect={() => handleSelect(`/files?file=${file.id}`)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{file.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {file.file_type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {clients && clients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Klienci">
              {clients.slice(0, 5).map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => handleSelect(`/admin?client=${client.id}`)}
                  className="gap-2"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{client.full_name || client.email}</span>
                  {client.company_name && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {client.company_name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {categories && categories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Kategorie">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => handleSelect(`/settings`)}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" style={{ color: category.color }} />
                  <span>{category.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
