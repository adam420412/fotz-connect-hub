import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-goog-channel-id, x-goog-channel-token, x-goog-resource-id, x-goog-resource-state, x-goog-resource-uri, x-goog-message-number",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      return data.access_token;
    }
    console.error("Failed to refresh token:", data);
    return null;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

async function getValidAccessToken(supabase: any, integration: any): Promise<string | null> {
  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);

  if (expiresAt > now) {
    return integration.access_token;
  }

  const newToken = await refreshAccessToken(integration.refresh_token);
  if (newToken) {
    await supabase
      .from("google_calendar_integrations")
      .update({
        access_token: newToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", integration.user_id);
  }
  return newToken;
}

async function fetchGoogleEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return { deleted: true };
    }
    throw new Error(`Failed to fetch event: ${response.status}`);
  }

  return await response.json();
}

async function syncFromGoogle(supabase: any, userId: string, integration: any) {
  console.log(`Syncing changes from Google Calendar for user ${userId}`);

  const accessToken = await getValidAccessToken(supabase, integration);
  if (!accessToken) {
    console.error("Could not get valid access token");
    return;
  }

  const calendarId = integration.calendar_id || "primary";

  // Get all synced events for this user
  const { data: syncedEvents } = await supabase
    .from("google_calendar_events")
    .select("*")
    .eq("user_id", userId);

  if (!syncedEvents || syncedEvents.length === 0) {
    console.log("No synced events found for user");
    return;
  }

  for (const syncedEvent of syncedEvents) {
    try {
      const googleEvent = await fetchGoogleEvent(accessToken, calendarId, syncedEvent.google_event_id);

      if (googleEvent.deleted || googleEvent.status === "cancelled") {
        // Event was deleted in Google Calendar
        console.log(`Event ${syncedEvent.google_event_id} was deleted in Google`);
        
        if (syncedEvent.local_entity_type === "calendar_event") {
          await supabase
            .from("team_calendar_events")
            .delete()
            .eq("id", syncedEvent.local_entity_id);
        } else if (syncedEvent.local_entity_type === "task") {
          // For tasks, we might want to mark as completed or update status
          await supabase
            .from("client_requests")
            .update({ status: "completed" })
            .eq("id", syncedEvent.local_entity_id);
        }

        // Remove sync record
        await supabase
          .from("google_calendar_events")
          .delete()
          .eq("id", syncedEvent.id);
        
        continue;
      }

      // Update local entity with Google Calendar data
      if (syncedEvent.local_entity_type === "calendar_event") {
        const startDate = googleEvent.start?.date || googleEvent.start?.dateTime?.split("T")[0];
        const endDate = googleEvent.end?.date || googleEvent.end?.dateTime?.split("T")[0];
        const startTime = googleEvent.start?.dateTime ? googleEvent.start.dateTime.split("T")[1].substring(0, 5) : null;
        const endTime = googleEvent.end?.dateTime ? googleEvent.end.dateTime.split("T")[1].substring(0, 5) : null;

        await supabase
          .from("team_calendar_events")
          .update({
            title: googleEvent.summary || "Untitled",
            description: googleEvent.description || null,
            start_date: startDate,
            end_date: endDate || startDate,
            start_time: startTime,
            end_time: endTime,
            all_day: !googleEvent.start?.dateTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", syncedEvent.local_entity_id);

        console.log(`Updated calendar event ${syncedEvent.local_entity_id} from Google`);
      } else if (syncedEvent.local_entity_type === "task") {
        const deadline = googleEvent.start?.date || googleEvent.start?.dateTime?.split("T")[0];

        await supabase
          .from("client_requests")
          .update({
            title: googleEvent.summary || "Untitled",
            description: googleEvent.description || null,
            deadline: deadline,
            updated_at: new Date().toISOString(),
          })
          .eq("id", syncedEvent.local_entity_id);

        console.log(`Updated task ${syncedEvent.local_entity_id} from Google`);
      }

      // Update last synced timestamp
      await supabase
        .from("google_calendar_events")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", syncedEvent.id);

    } catch (error) {
      console.error(`Error syncing event ${syncedEvent.google_event_id}:`, error);
    }
  }

  // Update last sync time for integration
  await supabase
    .from("google_calendar_integrations")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Google sends channel info in headers
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceState = req.headers.get("x-goog-resource-state");
    const channelToken = req.headers.get("x-goog-channel-token"); // This contains our user_id

    console.log("Webhook received:", { channelId, resourceState, channelToken });

    // Initial sync verification from Google
    if (resourceState === "sync") {
      console.log("Sync verification received");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For actual changes, we need user_id from channel token
    if (!channelToken) {
      console.log("No channel token, processing as manual sync trigger");
      
      // Try to get userId from request body for manual trigger
      const body = await req.json().catch(() => ({}));
      const userId = body.userId;
      
      if (userId) {
        const { data: integration } = await supabase
          .from("google_calendar_integrations")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (integration?.sync_enabled) {
          await syncFromGoogle(supabase, userId, integration);
          return new Response(JSON.stringify({ success: true, message: "Manual sync completed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = channelToken;

    // Get user's integration
    const { data: integration } = await supabase
      .from("google_calendar_integrations")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!integration || !integration.sync_enabled) {
      console.log("Integration not found or sync disabled for user:", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process the webhook - sync changes from Google
    if (resourceState === "exists" || resourceState === "update") {
      await syncFromGoogle(supabase, userId, integration);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
