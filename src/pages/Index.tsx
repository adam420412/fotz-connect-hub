import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import Preloader from "@/components/ui/Preloader";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthContext();
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    if (!isLoading && !showPreloader) {
      if (user) {
        navigate("/dashboard");
      } else {
        navigate("/auth");
      }
    }
  }, [user, isLoading, navigate, showPreloader]);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} minDuration={2500} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Index;
