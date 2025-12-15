import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
}

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      // Get all profiles that have the 'client' role
      const { data: clientRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (rolesError) throw rolesError;

      if (!clientRoles || clientRoles.length === 0) {
        return [];
      }

      const clientIds = clientRoles.map((r) => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name")
        .in("id", clientIds);

      if (profilesError) throw profilesError;

      return (profiles || []) as Client[];
    },
  });
}
