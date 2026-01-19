import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";
import { sendSlackNotification } from "@/utils/slackNotifications";

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  joined_at: string;
  is_active: boolean;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useProjectMembers(projectId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      let query = supabase
        .from("project_members")
        .select("*")
        .eq("is_active", true);
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query.order("joined_at", { ascending: false });

      if (error) throw error;
      return data as ProjectMember[];
    },
  });

  const { data: myProjects = [] } = useQuery({
    queryKey: ["my-project-memberships"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      return data as ProjectMember[];
    },
  });

  const joinProject = useMutation({
    mutationFn: async ({ projectId, projectName }: { projectId: string; projectName?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, projectName, userEmail: user.email };
    },
    onSuccess: async ({ data, projectName, userEmail }) => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-project-memberships"] });
      toast({
        title: "Dołączono do projektu",
        description: "Jesteś teraz członkiem tego projektu",
      });
      logActivity("project_join", "project_member", data.id, null, {
        project_id: data.project_id,
      });
      
      // Send Slack notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user_id)
        .single();
      
      sendSlackNotification(`👥 Nowy członek projektu "${projectName || 'Projekt'}"`, {
        Użytkownik: profile?.full_name || userEmail || "Nieznany",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message.includes("duplicate") 
          ? "Już jesteś członkiem tego projektu" 
          : "Nie udało się dołączyć do projektu",
        variant: "destructive",
      });
    },
  });

  const leaveProject = useMutation({
    mutationFn: async (projectId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", user.id);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["my-project-memberships"] });
      toast({
        title: "Opuszczono projekt",
      });
      logActivity("project_leave", "project_member", null, null, { project_id: projectId });
    },
  });

  const addMemberToProject = useMutation({
    mutationFn: async ({ projectId, userId, projectName }: { projectId: string; userId: string; projectName?: string }) => {
      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, projectName, userId };
    },
    onSuccess: async ({ data, projectName, userId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: "Członek dodany",
        description: "Użytkownik został dodany do projektu",
      });
      logActivity("project_join", "project_member", data.id, null, {
        project_id: data.project_id,
        added_by_admin: true,
      });
      
      // Get user profile for notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();
      
      sendSlackNotification(`👥 Nowy członek projektu "${projectName || 'Projekt'}"`, {
        Użytkownik: profile?.full_name || profile?.email || "Nieznany",
        Dodano: "przez administratora",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message.includes("duplicate") 
          ? "Użytkownik jest już członkiem projektu" 
          : "Nie udało się dodać użytkownika",
        variant: "destructive",
      });
    },
  });

  const removeMemberFromProject = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", userId);

      if (error) throw error;
      return { projectId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      toast({
        title: "Członek usunięty",
      });
    },
  });

  const isProjectMember = (projectId: string) => {
    return myProjects.some((m) => m.project_id === projectId);
  };

  return {
    members,
    myProjects,
    isLoading,
    joinProject: (projectId: string, projectName?: string) => joinProject.mutate({ projectId, projectName }),
    leaveProject: leaveProject.mutate,
    addMemberToProject: addMemberToProject.mutate,
    removeMemberFromProject: removeMemberFromProject.mutate,
    isJoining: joinProject.isPending,
    isLeaving: leaveProject.isPending,
    isAdding: addMemberToProject.isPending,
    isRemoving: removeMemberFromProject.isPending,
    isProjectMember,
  };
}
