import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonLabel?: string;
  mobileFriendly?: boolean;
}

// Context for sidebar state
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarContext = () => useContext(SidebarContext);

const DashboardLayout = ({
  children,
  title,
  showNewButton,
  onNewClick,
  newButtonLabel,
  mobileFriendly = false,
}: DashboardLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (!mobileFriendly) return;
    const media = window.matchMedia("(max-width: 767px)");
    const adjust = () => setCollapsed(media.matches);
    adjust();
    media.addEventListener("change", adjust);
    return () => media.removeEventListener("change", adjust);
  }, [mobileFriendly]);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div 
          className="transition-all duration-300"
          style={{ paddingLeft: collapsed ? '4rem' : '16rem' }}
        >
          <Header
            title={title}
            showNewButton={showNewButton}
            onNewClick={onNewClick}
            newButtonLabel={newButtonLabel}
          />
          <main className={mobileFriendly ? "min-w-0 p-3 sm:p-6" : "p-6"}>{children}</main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
