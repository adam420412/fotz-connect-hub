import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  return data;
}

async function getValidAccessToken(supabase: any, integration: any): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(integration.token_expires_at);
  
  // Refresh if token expires in less than 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log('Refreshing access token...');
    const newTokens = await refreshAccessToken(integration.refresh_token);
    
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    
    await supabase
      .from('google_calendar_integrations')
      .update({
        access_token: newTokens.access_token,
        token_expires_at: newExpiresAt,
      })
      .eq('user_id', integration.user_id);
    
    return newTokens.access_token;
  }
  
  return integration.access_token;
}

async function createOrUpdateGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: { date?: string; dateTime?: string; timeZone?: string };
    end: { date?: string; dateTime?: string; timeZone?: string };
    reminders?: { useDefault: boolean; overrides?: { method: string; minutes: number }[] };
  },
  eventId?: string
): Promise<string> {
  const url = eventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

  const response = await fetch(url, {
    method: eventId ? 'PUT' : 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message);
  }
  return data.id;
}

async function deleteGoogleEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, userId, entityType, entityId, entityData } = await req.json();

    console.log('Sync request:', { action, userId, entityType, entityId });

    // Get user's integration
    const { data: integration, error: intError } = await supabase
      .from('google_calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (intError || !integration) {
      console.log('No integration found for user:', userId);
      return new Response(
        JSON.stringify({ success: false, message: 'No Google Calendar integration' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.sync_enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'Sync disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getValidAccessToken(supabase, integration);
    const calendarId = integration.calendar_id || 'primary';

    if (action === 'delete') {
      // Find and delete the Google event
      const { data: syncedEvent } = await supabase
        .from('google_calendar_events')
        .select('google_event_id')
        .eq('user_id', userId)
        .eq('local_entity_type', entityType)
        .eq('local_entity_id', entityId)
        .single();

      if (syncedEvent) {
        await deleteGoogleEvent(accessToken, calendarId, syncedEvent.google_event_id);
        await supabase
          .from('google_calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('local_entity_type', entityType)
          .eq('local_entity_id', entityId);
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update event
    if (!entityData) {
      throw new Error('entityData is required for create/update');
    }

    // Format event based on entity type
    let googleEvent: any;
    
    if (entityType === 'task') {
      const deadline = entityData.deadline;
      googleEvent = {
        summary: `[Zadanie] ${entityData.title}`,
        description: entityData.description || '',
        start: { date: deadline },
        end: { date: deadline },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 24 * 60 }, // 24h before
            { method: 'popup', minutes: 60 }, // 1h before
          ],
        },
      };
    } else if (entityType === 'calendar_event') {
      const isAllDay = entityData.all_day;
      
      if (isAllDay) {
        googleEvent = {
          summary: entityData.title,
          description: entityData.description || '',
          start: { date: entityData.start_date },
          end: { date: entityData.end_date || entityData.start_date },
        };
      } else {
        const startDateTime = `${entityData.start_date}T${entityData.start_time || '09:00'}:00`;
        const endDateTime = `${entityData.end_date || entityData.start_date}T${entityData.end_time || '10:00'}:00`;
        
        googleEvent = {
          summary: entityData.title,
          description: entityData.description || '',
          start: { dateTime: startDateTime, timeZone: 'Europe/Warsaw' },
          end: { dateTime: endDateTime, timeZone: 'Europe/Warsaw' },
        };
      }
    }

    // Check if event already exists
    const { data: existingSyncedEvent } = await supabase
      .from('google_calendar_events')
      .select('google_event_id')
      .eq('user_id', userId)
      .eq('local_entity_type', entityType)
      .eq('local_entity_id', entityId)
      .single();

    const googleEventId = await createOrUpdateGoogleEvent(
      accessToken,
      calendarId,
      googleEvent,
      existingSyncedEvent?.google_event_id
    );

    // Save sync record
    await supabase
      .from('google_calendar_events')
      .upsert({
        user_id: userId,
        google_event_id: googleEventId,
        local_entity_type: entityType,
        local_entity_id: entityId,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'user_id,local_entity_type,local_entity_id' });

    // Update last sync time
    await supabase
      .from('google_calendar_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    console.log('Sync successful:', { googleEventId, entityType, entityId });

    return new Response(
      JSON.stringify({ success: true, googleEventId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
