import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_running: boolean;
  created_at: string;
  updated_at: string;
}

export function useTimeTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["time-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as TimeEntry[];
    },
  });

  const { data: runningEntry } = useQuery({
    queryKey: ["running-time-entry"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_running", true)
        .maybeSingle();

      if (error) throw error;
      return data as TimeEntry | null;
    },
  });

  const startTimer = useMutation({
    mutationFn: async ({ projectId, description }: { projectId?: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Stop any running timer first
      await supabase
        .from("time_entries")
        .update({ 
          is_running: false, 
          end_time: new Date().toISOString(),
          duration_minutes: 0 // Will be calculated on stop
        })
        .eq("user_id", user.id)
        .eq("is_running", true);

      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          description: description || null,
          start_time: new Date().toISOString(),
          is_running: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["running-time-entry"] });
      toast({
        title: "Timer uruchomiony",
        description: "Śledzenie czasu rozpoczęte",
      });
      logActivity("timer_start", "time_entry", data.id, null, {
        project_id: variables.projectId,
        description: variables.description,
      });
    },
  });

  const stopTimer = useMutation({
    mutationFn: async (entryId: string) => {
      const { data: entry } = await supabase
        .from("time_entries")
        .select("start_time")
        .eq("id", entryId)
        .single();

      if (!entry) throw new Error("Entry not found");

      const startTime = new Date(entry.start_time);
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      const { error } = await supabase
        .from("time_entries")
        .update({
          is_running: false,
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      queryClient.invalidateQueries({ queryKey: ["running-time-entry"] });
      toast({
        title: "Timer zatrzymany",
        description: "Czas pracy został zapisany",
      });
      logActivity("timer_stop", "time_entry", entryId);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: (_, entryId) => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast({
        title: "Wpis usunięty",
      });
      logActivity("time_entry_delete", "time_entry", entryId);
    },
  });

  // Calculate today's total
  const todayTotal = entries
    .filter((e) => {
      const entryDate = new Date(e.start_time).toDateString();
      const today = new Date().toDateString();
      return entryDate === today;
    })
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  // Calculate this week's total
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekTotal = entries
    .filter((e) => new Date(e.start_time) >= weekStart)
    .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  return {
    entries,
    isLoading,
    runningEntry,
    startTimer: startTimer.mutate,
    stopTimer: stopTimer.mutate,
    deleteEntry: deleteEntry.mutate,
    isStarting: startTimer.isPending,
    isStopping: stopTimer.isPending,
    todayTotal,
    weekTotal,
  };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}
