import { supabase } from "@/integrations/supabase/client";

interface SyncOptions {
  entityType: "task" | "calendar_event";
  entityId: string;
  entityData: Record<string, unknown>;
  action?: "upsert" | "delete";
}

/**
 * Sync an entity to Google Calendar if the user has integration enabled
 */
export async function syncToGoogleCalendar({
  entityType,
  entityId,
  entityData,
  action = "upsert",
}: SyncOptions): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has Google Calendar integration enabled
    const { data: integration } = await supabase
      .from("google_calendar_integrations")
      .select("sync_enabled")
      .eq("user_id", user.id)
      .single();

    if (!integration?.sync_enabled) {
      return;
    }

    // Trigger sync in background (don't await to not block UI)
    supabase.functions.invoke("google-calendar-sync", {
      body: {
        action,
        userId: user.id,
        entityType,
        entityId,
        entityData: action === "delete" ? undefined : entityData,
      },
    }).then((response) => {
      if (response.error) {
        console.error("Google Calendar sync error:", response.error);
      } else {
        console.log("Google Calendar sync:", response.data);
      }
    }).catch((error) => {
      console.error("Google Calendar sync failed:", error);
    });
  } catch (error) {
    console.error("Google Calendar sync check failed:", error);
  }
}
