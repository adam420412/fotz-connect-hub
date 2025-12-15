import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import Files from "./pages/Files";
import Messages from "./pages/Messages";
import Team from "./pages/Team";
import Settings from "./pages/Settings";
import AIAssistant from "./pages/AIAssistant";
import DailyPost from "./pages/DailyPost";
import MarketingNews from "./pages/MarketingNews";
import PostSchedule from "./pages/PostSchedule";
import NewRequest from "./pages/NewRequest";
import Invitations from "./pages/Invitations";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/files" element={<ProtectedRoute><Files /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute requireTeamMember><Team /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/ai-assistant" element={<ProtectedRoute requireTeamMember><AIAssistant /></ProtectedRoute>} />
            <Route path="/daily-post" element={<ProtectedRoute requireTeamMember><DailyPost /></ProtectedRoute>} />
            <Route path="/marketing-news" element={<ProtectedRoute requireTeamMember><MarketingNews /></ProtectedRoute>} />
            <Route path="/post-schedule" element={<ProtectedRoute><PostSchedule /></ProtectedRoute>} />
            <Route path="/new-request" element={<ProtectedRoute><NewRequest /></ProtectedRoute>} />
            <Route path="/invitations" element={<ProtectedRoute requireTeamMember><Invitations /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
