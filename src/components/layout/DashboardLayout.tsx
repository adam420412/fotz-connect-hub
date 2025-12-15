import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showNewButton?: boolean;
  onNewClick?: () => void;
  newButtonLabel?: string;
  userRole?: "client" | "employee" | "manager" | "admin";
}

const DashboardLayout = ({
  children,
  title,
  showNewButton,
  onNewClick,
  newButtonLabel,
  userRole = "client",
}: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="pl-64">
        <Header
          title={title}
          showNewButton={showNewButton}
          onNewClick={onNewClick}
          newButtonLabel={newButtonLabel}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
