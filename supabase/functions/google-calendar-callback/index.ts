import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return new Response(`
        <html>
          <body>
            <script>
              window.opener?.postMessage({ type: 'GOOGLE_CALENDAR_ERROR', error: '${error}' }, '*');
              window.close();
            </script>
            <p>Błąd autoryzacji: ${error}. Możesz zamknąć to okno.</p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    const { userId, returnUrl } = JSON.parse(atob(state));
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      throw new Error(tokens.error_description || tokens.error);
    }

    console.log('Token exchange successful for user:', userId);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Save tokens to database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: dbError } = await supabase
      .from('google_calendar_integrations')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        sync_enabled: true,
      }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save integration');
    }

    console.log('Integration saved successfully for user:', userId);

    // Return success page that communicates with opener window
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ type: 'GOOGLE_CALENDAR_SUCCESS' }, '*');
            setTimeout(() => window.close(), 1000);
          </script>
          <p>Połączono z Google Calendar! To okno zamknie się automatycznie.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Callback error:', error);
    return new Response(`
      <html>
        <body>
          <script>
            window.opener?.postMessage({ type: 'GOOGLE_CALENDAR_ERROR', error: '${errorMessage}' }, '*');
          </script>
          <p>Wystąpił błąd: ${errorMessage}. Możesz zamknąć to okno.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});
