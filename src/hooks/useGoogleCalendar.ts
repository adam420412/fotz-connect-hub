import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface GoogleCalendarIntegration {
  id: string;
  user_id: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  calendar_id: string | null;
}

export function useGoogleCalendar(userId: string | undefined) {
  const { toast } = useToast();
  const [integration, setIntegration] = useState<GoogleCalendarIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchIntegration = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("google_calendar_integrations")
        .select("id, user_id, sync_enabled, last_sync_at, calendar_id")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching integration:", error);
      }
      
      setIntegration(data);
    } catch (error) {
      console.error("Error fetching integration:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "GOOGLE_CALENDAR_SUCCESS") {
        toast({
          title: "Połączono z Google Calendar",
          description: "Twoje wydarzenia będą automatycznie synchronizowane",
        });
        fetchIntegration();
        setIsConnecting(false);
      } else if (event.data?.type === "GOOGLE_CALENDAR_ERROR") {
        toast({
          title: "Błąd połączenia",
          description: event.data.error || "Nie udało się połączyć z Google Calendar",
          variant: "destructive",
        });
        setIsConnecting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [toast, fetchIntegration]);

  const connect = async () => {
    if (!userId) {
      toast({
        title: "Błąd",
        description: "Musisz być zalogowany",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("No session token");
      }

      const response = await supabase.functions.invoke("google-calendar-auth", {
        body: { userId, returnUrl: window.location.href },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        authUrl,
        "google-calendar-auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      console.error("Connection error:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się rozpocząć autoryzacji",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("google_calendar_integrations")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Also delete synced events records
      await supabase
        .from("google_calendar_events")
        .delete()
        .eq("user_id", userId);

      setIntegration(null);
      toast({
        title: "Rozłączono",
        description: "Integracja z Google Calendar została wyłączona",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się rozłączyć",
        variant: "destructive",
      });
    }
  };

  const toggleSync = async (enabled: boolean) => {
    if (!userId || !integration) return;

    try {
      const { error } = await supabase
        .from("google_calendar_integrations")
        .update({ sync_enabled: enabled })
        .eq("user_id", userId);

      if (error) throw error;

      setIntegration((prev) => prev ? { ...prev, sync_enabled: enabled } : null);
      toast({
        title: enabled ? "Synchronizacja włączona" : "Synchronizacja wyłączona",
      });
    } catch (error) {
      console.error("Toggle sync error:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zmienić ustawień synchronizacji",
        variant: "destructive",
      });
    }
  };

  const syncEntity = async (
    entityType: "task" | "calendar_event",
    entityId: string,
    entityData: Record<string, unknown>,
    action: "upsert" | "delete" = "upsert"
  ) => {
    if (!userId || !integration?.sync_enabled) return;

    try {
      await supabase.functions.invoke("google-calendar-sync", {
        body: {
          action,
          userId,
          entityType,
          entityId,
          entityData: action === "delete" ? undefined : entityData,
        },
      });
    } catch (error) {
      console.error("Sync entity error:", error);
    }
  };

  // Silent background sync (no toast notifications)
  const backgroundSync = useCallback(async () => {
    if (!userId || !integration?.sync_enabled || isSyncing) return;

    setIsSyncing(true);
    try {
      console.log("[Google Calendar] Background sync started");
      await supabase.functions.invoke("google-calendar-webhook", {
        body: { userId },
      });
      await fetchIntegration();
      console.log("[Google Calendar] Background sync completed");
    } catch (error) {
      console.error("[Google Calendar] Background sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [userId, integration?.sync_enabled, isSyncing, fetchIntegration]);

  // Auto-sync every 5 minutes when sync is enabled
  useEffect(() => {
    if (integration?.sync_enabled && userId) {
      // Run initial sync
      backgroundSync();

      // Set up interval
      syncIntervalRef.current = setInterval(() => {
        backgroundSync();
      }, SYNC_INTERVAL_MS);

      console.log("[Google Calendar] Auto-sync enabled (every 5 minutes)");
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
        console.log("[Google Calendar] Auto-sync disabled");
      }
    };
  }, [integration?.sync_enabled, userId, backgroundSync]);

  const syncFromGoogle = async () => {
    if (!userId || !integration?.sync_enabled) {
      toast({
        title: "Synchronizacja niedostępna",
        description: "Włącz synchronizację, aby pobierać zmiany z Google Calendar",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      toast({
        title: "Synchronizacja...",
        description: "Pobieranie zmian z Google Calendar",
      });

      const response = await supabase.functions.invoke("google-calendar-webhook", {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      await fetchIntegration();

      toast({
        title: "Zsynchronizowano",
        description: "Zmiany z Google Calendar zostały pobrane",
      });
    } catch (error) {
      console.error("Sync from Google error:", error);
      toast({
        title: "Błąd synchronizacji",
        description: "Nie udało się pobrać zmian z Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    integration,
    isLoading,
    isConnecting,
    isSyncing,
    isConnected: !!integration,
    connect,
    disconnect,
    toggleSync,
    syncEntity,
    syncFromGoogle,
    refresh: fetchIntegration,
  };
}
