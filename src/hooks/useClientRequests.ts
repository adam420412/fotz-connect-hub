import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";
import { syncToGoogleCalendar } from "@/utils/googleCalendarSync";
import { notifyTaskStatusChange, notifyNewTask } from "@/utils/slackNotifications";

export interface ClientRequest {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  request_type: "task" | "feedback" | "comment" | "other";
  related_file_id: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to: string | null;
  deadline: string | null;
  reminder_sent: boolean;
  category_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  assigned_member?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

export interface CreateRequestData {
  title: string;
  description?: string;
  request_type: "task" | "feedback" | "comment" | "other";
  related_file_id?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  project_id?: string;
}

export interface RequestStats {
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  total: number;
}

export function useClientRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["client-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          assigned_member:team_members!client_requests_assigned_to_fkey(
            id,
            name,
            email,
            avatar_url
          ),
          category:task_categories(
            id,
            name,
            color
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientRequest[];
    },
  });

  // Calculate stats
  const stats: RequestStats = {
    pending: requests.filter((r) => r.status === "pending").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
    total: requests.length,
  };

  const createRequest = useMutation({
    mutationFn: async (requestData: CreateRequestData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("client_requests")
        .insert({
          ...requestData,
          client_id: user.id,
          project_id: requestData.project_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      toast({
        title: "Zadanie wysłane",
        description: "Zespół otrzyma powiadomienie o Twoim zadaniu",
      });
      logActivity("request_create", "request", data.id, variables.title, {
        request_type: variables.request_type,
        priority: variables.priority || "normal",
      });
      // Sync task with deadline to Google Calendar
      if (data.deadline) {
        syncToGoogleCalendar({
          entityType: "task",
          entityId: data.id,
          entityData: {
            title: data.title,
            description: data.description,
            deadline: data.deadline,
          },
        });
      }
      // Get user profile for Slack notification
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        
        notifyNewTask(
          variables.title,
          profile?.full_name || profile?.email || "Użytkownik",
          variables.priority
        );
      }
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-requests"] });
      toast({
        title: "Zaktualizowano",
        description: "Zadanie zostało zaktualizowane",
      });
      logActivity("request_update", "request", variables.id, null, {
        updated_fields: Object.keys(variables).filter(k => k !== 'id'),
      });
      // Sync to Google Calendar if deadline exists
      if (variables.deadline !== undefined) {
        syncToGoogleCalendar({
          entityType: "task",
          entityId: variables.id,
          entityData: {
            title: variables.title,
            description: variables.description,
            deadline: variables.deadline,
          },
        });
      }
    },
  });

  return {
    requests,
    stats,
    isLoading,
    createRequest: createRequest.mutate,
    updateRequest: updateRequest.mutate,
    isCreating: createRequest.isPending,
  };
}
