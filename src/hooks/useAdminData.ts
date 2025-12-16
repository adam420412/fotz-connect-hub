import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useAuth";
import { logActivity } from "@/hooks/useActivityLogger";

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  is_active: boolean;
  role: AppRole | null;
  created_at: string;
  assigned_team_member_id: string | null;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: any;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useAdminData() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return;
    }

    const rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

    const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      company_name: profile.company_name,
      is_active: profile.is_active ?? true,
      role: rolesMap.get(profile.id) as AppRole | null,
      created_at: profile.created_at,
      assigned_team_member_id: profile.assigned_team_member_id,
    }));

    setUsers(usersWithRoles);
  };

  const fetchActivityLogs = async () => {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching activity logs:", error);
      return;
    }

    setActivityLogs(data || []);
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, email, role")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching team members:", error);
      return;
    }

    setTeamMembers(data || []);
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić roli użytkownika",
        variant: "destructive",
      });
      return false;
    }

    await logActivity("role_change", "user", userId, null, { new_role: newRole });
    await fetchUsers();
    
    toast({
      title: "Sukces",
      description: "Rola użytkownika została zmieniona",
    });
    return true;
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId);

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić statusu użytkownika",
        variant: "destructive",
      });
      return false;
    }

    await logActivity(
      isActive ? "user_activated" : "user_deactivated",
      "user",
      userId
    );
    await fetchUsers();

    toast({
      title: "Sukces",
      description: isActive ? "Użytkownik aktywowany" : "Użytkownik dezaktywowany",
    });
    return true;
  };

  const assignTeamMember = async (clientId: string, teamMemberId: string | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ assigned_team_member_id: teamMemberId })
      .eq("id", clientId);

    if (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się przypisać opiekuna",
        variant: "destructive",
      });
      return false;
    }

    await logActivity("team_member_assigned", "client", clientId, null, {
      team_member_id: teamMemberId,
    });
    await fetchUsers();

    toast({
      title: "Sukces",
      description: "Opiekun został przypisany",
    });
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchUsers(), fetchActivityLogs(), fetchTeamMembers()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return {
    users,
    activityLogs,
    teamMembers,
    isLoading,
    updateUserRole,
    toggleUserActive,
    assignTeamMember,
    refetchUsers: fetchUsers,
    refetchLogs: fetchActivityLogs,
  };
}
