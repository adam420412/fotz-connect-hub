import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/hooks/useActivityLogger";

export interface TeamMemberRate {
  id: string;
  user_id: string;
  hourly_rate: number;
  currency: string;
  updated_at: string;
  updated_by: string | null;
}

export interface TeamMemberRateWithProfile extends TeamMemberRate {
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export function useTeamMemberRates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["team-member-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_member_rates")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as TeamMemberRate[];
    },
  });

  const { data: myRate } = useQuery({
    queryKey: ["my-hourly-rate"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("team_member_rates")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TeamMemberRate | null;
    },
  });

  const setRate = useMutation({
    mutationFn: async ({ userId, hourlyRate, currency = "PLN" }: { 
      userId: string; 
      hourlyRate: number; 
      currency?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("team_member_rates")
        .upsert({
          user_id: userId,
          hourly_rate: hourlyRate,
          currency,
          updated_by: user.id,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-member-rates"] });
      queryClient.invalidateQueries({ queryKey: ["my-hourly-rate"] });
      toast({
        title: "Stawka zaktualizowana",
        description: `Ustawiono stawkę ${data.hourly_rate} ${data.currency}/h`,
      });
      logActivity("rate_update", "team_member_rate", data.id, null, {
        user_id: data.user_id,
        hourly_rate: data.hourly_rate,
        currency: data.currency,
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować stawki",
        variant: "destructive",
      });
    },
  });

  const getRateForUser = (userId: string) => {
    return rates.find((r) => r.user_id === userId);
  };

  const calculateEarnings = (userId: string, durationMinutes: number) => {
    const rate = getRateForUser(userId);
    if (!rate) return null;
    const hours = durationMinutes / 60;
    return {
      amount: hours * rate.hourly_rate,
      currency: rate.currency,
    };
  };

  return {
    rates,
    myRate,
    isLoading,
    setRate: setRate.mutate,
    isSettingRate: setRate.isPending,
    getRateForUser,
    calculateEarnings,
  };
}
