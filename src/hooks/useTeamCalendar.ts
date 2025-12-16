import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";
import { syncToGoogleCalendar } from "@/utils/googleCalendarSync";

export type CalendarEventType = "vacation" | "availability" | "deadline" | "meeting" | "other";
export type CalendarEventStatus = "pending" | "confirmed" | "cancelled";

export interface TeamCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  user_id: string | null;
  project_name: string | null;
  color: string;
  status: CalendarEventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  event_type: CalendarEventType;
  start_date: string;
  end_date?: string;
  all_day?: boolean;
  start_time?: string;
  end_time?: string;
  user_id?: string;
  project_name?: string;
  color?: string;
  status?: CalendarEventStatus;
}

export function useTeamCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["team-calendar-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_calendar_events")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as TeamCalendarEvent[];
    },
  });

  const createEvent = useMutation({
    mutationFn: async (eventData: CreateCalendarEventData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("team_calendar_events")
        .insert({
          ...eventData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-calendar-events"] });
      toast({
        title: "Wydarzenie dodane",
        description: "Wydarzenie zostało dodane do kalendarza",
      });
      logActivity("calendar_event_create" as any, "calendar" as any, data.id, variables.title, {
        event_type: variables.event_type,
        start_date: variables.start_date,
      });
      // Sync to Google Calendar
      syncToGoogleCalendar({
        entityType: "calendar_event",
        entityId: data.id,
        entityData: data,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się dodać wydarzenia",
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamCalendarEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_calendar_events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-calendar-events"] });
      toast({
        title: "Zaktualizowano",
        description: "Wydarzenie zostało zaktualizowane",
      });
      // Sync to Google Calendar
      syncToGoogleCalendar({
        entityType: "calendar_event",
        entityId: data.id,
        entityData: data,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się zaktualizować wydarzenia",
        variant: "destructive",
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_calendar_events")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["team-calendar-events"] });
      toast({
        title: "Usunięto",
        description: "Wydarzenie zostało usunięte",
      });
      // Delete from Google Calendar
      syncToGoogleCalendar({
        entityType: "calendar_event",
        entityId: id,
        entityData: {},
        action: "delete",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się usunąć wydarzenia",
        variant: "destructive",
      });
    },
  });

  return {
    events,
    isLoading,
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
    isCreating: createEvent.isPending,
  };
}

export const eventTypeConfig: Record<CalendarEventType, { label: string; color: string; icon: string }> = {
  vacation: { label: "Urlop", color: "#22c55e", icon: "🏖️" },
  availability: { label: "Niedostępność", color: "#f59e0b", icon: "⚠️" },
  deadline: { label: "Termin", color: "#ef4444", icon: "📅" },
  meeting: { label: "Spotkanie", color: "#3b82f6", icon: "👥" },
  other: { label: "Inne", color: "#8b5cf6", icon: "📌" },
};
