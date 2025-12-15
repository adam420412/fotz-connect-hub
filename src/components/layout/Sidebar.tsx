import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileBox,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Zap,
  Newspaper,
  CalendarDays,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  userRole?: "client" | "employee" | "manager" | "admin";
}

const Sidebar = ({ userRole = "client" }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const clientNav = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FolderKanban, label: "Projekty", href: "/projects" },
    { icon: CheckSquare, label: "Zadania", href: "/tasks" },
    { icon: FileBox, label: "Pliki", href: "/files" },
    { icon: MessageSquare, label: "Wiadomości", href: "/messages" },
  ];

  const teamNav = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: FolderKanban, label: "Projekty", href: "/projects" },
    { icon: CheckSquare, label: "Zadania", href: "/tasks" },
    { icon: FileBox, label: "Pliki", href: "/files" },
    { icon: Users, label: "Zespół", href: "/team" },
    { icon: MessageSquare, label: "Wiadomości", href: "/messages" },
    { icon: Bot, label: "AI Asystent", href: "/ai-assistant" },
    { icon: CalendarDays, label: "Codzienny Post", href: "/daily-post" },
    { icon: Newspaper, label: "Newsy Marketing", href: "/marketing-news" },
  ];

  const navItems = userRole === "client" ? clientNav : teamNav;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">
                FOTZ<span className="text-primary">.</span>Studio
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3 space-y-1">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Ustawienia</span>}
          </Link>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Wyloguj</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
