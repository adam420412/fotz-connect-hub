import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type IntegrationSource = Database["public"]["Tables"]["integration_sources"]["Row"];
export type GrowthCampaign = Database["public"]["Tables"]["growth_campaigns"]["Row"];
export type LeadTouchpoint = Database["public"]["Tables"]["lead_touchpoints"]["Row"];

export function useGrowthOS() {
  const integrations = useQuery({
    queryKey: ["growth-os", "integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_sources")
        .select("*")
        .order("display_name");
      if (error) throw error;
      return data as IntegrationSource[];
    },
  });

  const campaigns = useQuery({
    queryKey: ["growth-os", "campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("growth_campaigns")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as GrowthCampaign[];
    },
  });

  const touchpoints = useQuery({
    queryKey: ["growth-os", "touchpoints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_touchpoints")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return data as LeadTouchpoint[];
    },
  });

  return {
    integrations: integrations.data ?? [],
    campaigns: campaigns.data ?? [],
    touchpoints: touchpoints.data ?? [],
    isLoading: integrations.isLoading || campaigns.isLoading || touchpoints.isLoading,
    schemaReady: !integrations.error && !campaigns.error && !touchpoints.error,
    error: integrations.error || campaigns.error || touchpoints.error,
  };
}
