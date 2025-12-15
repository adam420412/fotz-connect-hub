import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ClientRequest {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  request_type: "task" | "feedback" | "comment" | "other";
  related_file_id: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

export interface CreateRequestData {
  title: string;
  description?: string;
  request_type: "task" | "feedback" | "comment" | "other";
  related_file_id?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

export function useClientRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["client-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (requestData: CreateRequestData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("client_requests")
        .insert({
          ...requestData,
          client_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      toast({
        title: "Zadanie wysłane",
        description: "Zespół otrzyma powiadomienie o Twoim zadaniu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ClientRequest> & { id: string }) => {
      const { error } = await supabase
        .from("client_requests")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      toast({
        title: "Zaktualizowano",
        description: "Status zadania został zmieniony",
      });
    },
  });

  return {
    requests,
    isLoading,
    createRequest: createRequest.mutate,
    updateRequest: updateRequest.mutate,
    isCreating: createRequest.isPending,
  };
}
