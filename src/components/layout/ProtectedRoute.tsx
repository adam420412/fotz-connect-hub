import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireTeamMember?: boolean;
  requireAdmin?: boolean;
  requireManagerOrAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireTeamMember = false, 
  requireAdmin = false,
  requireManagerOrAdmin = false 
}: ProtectedRouteProps) => {
  const { user, isLoading, isTeamMember, role } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireManagerOrAdmin && role !== "admin" && role !== "manager") {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireTeamMember && !isTeamMember) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
