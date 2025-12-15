import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: string;
  email: string;
  company_name: string | null;
  role: "admin" | "manager" | "employee" | "client";
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  invited_by: string | null;
}

export function useInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
  });

  const createInvitation = useMutation({
    mutationFn: async ({
      email,
      companyName,
      role,
    }: {
      email: string;
      companyName: string;
      role: "admin" | "manager" | "employee" | "client";
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          email,
          company_name: companyName,
          role,
          invited_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Zaproszenie wysłane",
        description: "Link rejestracyjny został wygenerowany",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć zaproszenia",
        variant: "destructive",
      });
    },
  });

  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Usunięto",
        description: "Zaproszenie zostało usunięte",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć zaproszenia",
        variant: "destructive",
      });
    },
  });

  return {
    invitations,
    isLoading,
    createInvitation,
    deleteInvitation,
  };
}
